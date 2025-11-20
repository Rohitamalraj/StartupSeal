// Trust Oracle Module
// Maintains decentralized trust score validation with multi-validator consensus

module trust_engine::trust_oracle {
    use sui::object::{Self, UID, ID};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use sui::event;
    use std::string::String;
    use sui::vec_map::{Self, VecMap};
    use sui::clock::{Self, Clock};
    use sui::vec_set::{Self, VecSet};

    // ==================== Error Codes ====================
    const E_UNAUTHORIZED: u64 = 1;
    const E_VALIDATOR_ALREADY_EXISTS: u64 = 2;
    const E_INVALID_SCORE: u64 = 3;
    const E_INSUFFICIENT_VALIDATIONS: u64 = 4;
    const E_ALREADY_VALIDATED: u64 = 5;

    // ==================== Structs ====================

    /// Oracle admin capability
    public struct OracleAdmin has key, store {
        id: UID,
    }

    /// Validator capability - issued to trusted validators
    public struct ValidatorCap has key, store {
        id: UID,
        validator_address: address,
        reputation_score: u64,
        total_validations: u64,
        accurate_validations: u64,
    }

    /// Trust validation request
    public struct ValidationRequest has key, store {
        id: UID,
        startup_name: String,
        trust_record_id: ID,
        github_repo: String,
        github_verified: bool,
        certificate_blob_ids: vector<String>,
        certificate_verified: bool,
        requested_by: address,
        timestamp: u64,
        validations: VecMap<address, ValidationScore>,
        consensus_reached: bool,
        final_score: u64,
    }

    /// Individual validation score from a validator
    public struct ValidationScore has store, copy, drop {
        validator: address,
        github_ownership_score: u64,
        github_activity_score: u64,
        certificate_authenticity_score: u64,
        overall_score: u64,
        timestamp: u64,
        comments: String,
    }

    /// Oracle registry - tracks all validators and requests
    public struct OracleRegistry has key {
        id: UID,
        validators: VecSet<address>,
        total_requests: u64,
        consensus_threshold: u64, // Minimum validations needed
        reputation_threshold: u64, // Minimum validator reputation
    }

    // ==================== Events ====================

    public struct ValidatorRegistered has copy, drop {
        validator_address: address,
        timestamp: u64,
    }

    public struct ValidationSubmitted has copy, drop {
        request_id: ID,
        validator: address,
        score: u64,
        timestamp: u64,
    }

    public struct ConsensusReached has copy, drop {
        request_id: ID,
        final_score: u64,
        total_validators: u64,
        timestamp: u64,
    }

    public struct ValidatorReputationUpdated has copy, drop {
        validator: address,
        new_reputation: u64,
        total_validations: u64,
    }

    // ==================== Initialize ====================

    fun init(ctx: &mut TxContext) {
        // Create admin capability
        let admin = OracleAdmin {
            id: object::new(ctx),
        };

        // Create oracle registry
        let registry = OracleRegistry {
            id: object::new(ctx),
            validators: vec_set::empty(),
            total_requests: 0,
            consensus_threshold: 3, // Need 3 validators minimum
            reputation_threshold: 70, // Validators need 70+ reputation
        };

        transfer::transfer(admin, tx_context::sender(ctx));
        transfer::share_object(registry);
    }

    // ==================== Admin Functions ====================

    /// Register a new validator
    public entry fun register_validator(
        _admin: &OracleAdmin,
        registry: &mut OracleRegistry,
        validator_address: address,
        ctx: &mut TxContext
    ) {
        assert!(!vec_set::contains(&registry.validators, &validator_address), E_VALIDATOR_ALREADY_EXISTS);

        vec_set::insert(&mut registry.validators, validator_address);

        let validator_cap = ValidatorCap {
            id: object::new(ctx),
            validator_address,
            reputation_score: 100, // Start with perfect reputation
            total_validations: 0,
            accurate_validations: 0,
        };

        event::emit(ValidatorRegistered {
            validator_address,
            timestamp: tx_context::epoch(ctx),
        });

        transfer::transfer(validator_cap, validator_address);
    }

    /// Update consensus parameters
    public entry fun update_consensus_params(
        _admin: &OracleAdmin,
        registry: &mut OracleRegistry,
        consensus_threshold: u64,
        reputation_threshold: u64,
    ) {
        registry.consensus_threshold = consensus_threshold;
        registry.reputation_threshold = reputation_threshold;
    }

    // ==================== Validation Request Functions ====================

    /// Create a new validation request
    public entry fun create_validation_request(
        registry: &mut OracleRegistry,
        startup_name: String,
        trust_record_id: ID,
        github_repo: String,
        github_verified: bool,
        certificate_blob_ids: vector<String>,
        certificate_verified: bool,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let request = ValidationRequest {
            id: object::new(ctx),
            startup_name,
            trust_record_id,
            github_repo,
            github_verified,
            certificate_blob_ids,
            certificate_verified,
            requested_by: tx_context::sender(ctx),
            timestamp: clock::timestamp_ms(clock),
            validations: vec_map::empty(),
            consensus_reached: false,
            final_score: 0,
        };

        registry.total_requests = registry.total_requests + 1;
        transfer::share_object(request);
    }

    /// Submit validation score
    public entry fun submit_validation(
        validator_cap: &mut ValidatorCap,
        request: &mut ValidationRequest,
        registry: &OracleRegistry,
        github_ownership_score: u64,
        github_activity_score: u64,
        certificate_authenticity_score: u64,
        comments: String,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        // Verify validator is authorized and has good reputation
        let validator_address = tx_context::sender(ctx);
        assert!(vec_set::contains(&registry.validators, &validator_address), E_UNAUTHORIZED);
        assert!(validator_cap.reputation_score >= registry.reputation_threshold, E_UNAUTHORIZED);
        
        // Check not already validated
        assert!(!vec_map::contains(&request.validations, &validator_address), E_ALREADY_VALIDATED);

        // Validate scores
        assert!(github_ownership_score <= 100, E_INVALID_SCORE);
        assert!(github_activity_score <= 100, E_INVALID_SCORE);
        assert!(certificate_authenticity_score <= 100, E_INVALID_SCORE);

        // Calculate overall score (weighted average)
        let overall_score = (
            github_ownership_score * 40 +
            github_activity_score * 30 +
            certificate_authenticity_score * 30
        ) / 100;

        let validation = ValidationScore {
            validator: validator_address,
            github_ownership_score,
            github_activity_score,
            certificate_authenticity_score,
            overall_score,
            timestamp: clock::timestamp_ms(clock),
            comments,
        };

        vec_map::insert(&mut request.validations, validator_address, validation);
        validator_cap.total_validations = validator_cap.total_validations + 1;

        event::emit(ValidationSubmitted {
            request_id: object::uid_to_inner(&request.id),
            validator: validator_address,
            score: overall_score,
            timestamp: clock::timestamp_ms(clock),
        });

        // Check if consensus reached
        check_and_finalize_consensus(request, registry, clock);
    }

    /// Check if consensus is reached and finalize
    fun check_and_finalize_consensus(
        request: &mut ValidationRequest,
        registry: &OracleRegistry,
        clock: &Clock,
    ) {
        let validation_count = vec_map::length(&request.validations);
        
        if (validation_count >= registry.consensus_threshold && !request.consensus_reached) {
            // Calculate average score
            let mut total_score: u64 = 0;
            let mut i = 0;
            let keys = vec_map::keys(&request.validations);
            
            while (i < vec_map::size(&request.validations)) {
                let validator_addr = vector::borrow(&keys, i);
                let validation = vec_map::get(&request.validations, validator_addr);
                total_score = total_score + validation.overall_score;
                i = i + 1;
            };

            let final_score = total_score / validation_count;
            request.final_score = final_score;
            request.consensus_reached = true;

            event::emit(ConsensusReached {
                request_id: object::uid_to_inner(&request.id),
                final_score,
                total_validators: validation_count,
                timestamp: clock::timestamp_ms(clock),
            });
        };
    }

    // ==================== Reputation Management ====================

    /// Update validator reputation based on accuracy
    public entry fun update_validator_reputation(
        _admin: &OracleAdmin,
        validator_cap: &mut ValidatorCap,
        was_accurate: bool,
        ctx: &mut TxContext
    ) {
        if (was_accurate) {
            validator_cap.accurate_validations = validator_cap.accurate_validations + 1;
            // Increase reputation (max 100)
            if (validator_cap.reputation_score < 100) {
                validator_cap.reputation_score = validator_cap.reputation_score + 1;
            };
        } else {
            // Decrease reputation
            if (validator_cap.reputation_score > 10) {
                validator_cap.reputation_score = validator_cap.reputation_score - 5;
            };
        };

        event::emit(ValidatorReputationUpdated {
            validator: validator_cap.validator_address,
            new_reputation: validator_cap.reputation_score,
            total_validations: validator_cap.total_validations,
        });
    }

    // ==================== View Functions ====================

    /// Get validation request details
    public fun get_request_status(request: &ValidationRequest): (bool, u64, u64) {
        (request.consensus_reached, request.final_score, vec_map::length(&request.validations))
    }

    /// Get validator reputation
    public fun get_validator_reputation(cap: &ValidatorCap): (u64, u64, u64) {
        (cap.reputation_score, cap.total_validations, cap.accurate_validations)
    }

    /// Check if validator can validate
    public fun can_validate(cap: &ValidatorCap, registry: &OracleRegistry): bool {
        cap.reputation_score >= registry.reputation_threshold
    }

    #[test_only]
    public fun init_for_testing(ctx: &mut TxContext) {
        init(ctx);
    }
}
