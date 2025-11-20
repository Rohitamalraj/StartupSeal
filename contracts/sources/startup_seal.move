// StartupSeal - Hackathon-Ready Trust Verification System
// Simplified for hackathon demo with essential security features

module trust_engine::startup_seal {
    use sui::object::{Self, UID, ID};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use sui::event;
    use std::string::{Self, String};
    use sui::vec_map::{Self, VecMap};
    use sui::clock::{Self, Clock};
    use sui::hash;

    // ======= Error Codes =======
    const E_INVALID_SCORE: u64 = 1;
    const E_INVALID_BLOB_ID: u64 = 2;
    const E_REPLAY_ATTACK: u64 = 3;
    const E_INVALID_SIGNATURE: u64 = 4;

    // ======= Constants =======
    const MAX_SCORE: u64 = 100;

    // ======= Structs =======

    /// StartupSeal - Verifiable trust certificate (NFT/SBT)
    public struct StartupSeal has key, store {
        id: UID,
        startup_name: String,
        github_repo: String,
        
        // Hackathon verification
        hackathon_name: String,
        hackathon_verified: bool,
        
        // Walrus storage
        certificate_blob_ids: vector<String>,
        document_hash: vector<u8>,
        
        // Trust scores
        hackathon_score: u64,      // 40% weight
        github_score: u64,          // 30% weight
        ai_consistency_score: u64,  // 20% weight
        document_score: u64,        // 10% weight
        overall_trust_score: u64,   // Final calculated score
        
        // Security
        submission_hash: vector<u8>,
        nonce: u64,
        
        // Metadata
        owner: address,
        timestamp: u64,
        version: u64,
    }

    /// Registry to track all seals and prevent replay attacks
    public struct SealRegistry has key {
        id: UID,
        total_seals: u64,
        total_verified: u64,
        nonces: VecMap<address, u64>, // Track nonces per address
        submission_hashes: VecMap<vector<u8>, bool>, // Prevent duplicate submissions
    }

    // ======= Events =======

    public struct SealMinted has copy, drop {
        seal_id: ID,
        startup_name: String,
        owner: address,
        trust_score: u64,
        timestamp: u64,
    }

    public struct SealScoreUpdated has copy, drop {
        seal_id: ID,
        old_score: u64,
        new_score: u64,
        timestamp: u64,
    }

    // ======= Initialization =======

    fun init(ctx: &mut TxContext) {
        let registry = SealRegistry {
            id: object::new(ctx),
            total_seals: 0,
            total_verified: 0,
            nonces: vec_map::empty(),
            submission_hashes: vec_map::empty(),
        };
        transfer::share_object(registry);
    }

    // ======= Core Functions =======

    /// Mint a StartupSeal - Direct submission without admin approval
    public entry fun mint_startup_seal(
        registry: &mut SealRegistry,
        startup_name: vector<u8>,
        github_repo: vector<u8>,
        hackathon_name: vector<u8>,
        certificate_blob_ids: vector<vector<u8>>,
        document_hash: vector<u8>,
        hackathon_score: u64,
        github_score: u64,
        ai_consistency_score: u64,
        document_score: u64,
        nonce: u64,
        submission_hash: vector<u8>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        
        // SECURITY: Prevent replay attacks
        validate_nonce(registry, sender, nonce);
        
        // SECURITY: Prevent duplicate submissions
        validate_unique_submission(registry, &submission_hash);
        
        // Validate scores
        assert!(hackathon_score <= MAX_SCORE, E_INVALID_SCORE);
        assert!(github_score <= MAX_SCORE, E_INVALID_SCORE);
        assert!(ai_consistency_score <= MAX_SCORE, E_INVALID_SCORE);
        assert!(document_score <= MAX_SCORE, E_INVALID_SCORE);

        // Calculate overall trust score (weighted average)
        let overall_trust_score = calculate_trust_score(
            hackathon_score,
            github_score,
            ai_consistency_score,
            document_score
        );

        // Convert blob IDs to strings
        let mut blob_ids = vector::empty<String>();
        let mut i = 0;
        let len = vector::length(&certificate_blob_ids);
        while (i < len) {
            vector::push_back(&mut blob_ids, string::utf8(*vector::borrow(&certificate_blob_ids, i)));
            i = i + 1;
        };

        // Create the seal
        let seal = StartupSeal {
            id: object::new(ctx),
            startup_name: string::utf8(startup_name),
            github_repo: string::utf8(github_repo),
            hackathon_name: string::utf8(hackathon_name),
            hackathon_verified: hackathon_score >= 70, // Auto-verify if score > 70%
            certificate_blob_ids: blob_ids,
            document_hash,
            hackathon_score,
            github_score,
            ai_consistency_score,
            document_score,
            overall_trust_score,
            submission_hash,
            nonce,
            owner: sender,
            timestamp: clock::timestamp_ms(clock),
            version: 1,
        };

        let seal_id = object::id(&seal);

        // Update registry
        registry.total_seals = registry.total_seals + 1;
        if (seal.hackathon_verified) {
            registry.total_verified = registry.total_verified + 1;
        };
        
        // Update nonce
        if (vec_map::contains(&registry.nonces, &sender)) {
            let (_old_key, _old_nonce) = vec_map::remove(&mut registry.nonces, &sender);
            vec_map::insert(&mut registry.nonces, sender, nonce);
        } else {
            vec_map::insert(&mut registry.nonces, sender, nonce);
        };
        
        // Mark submission hash as used
        vec_map::insert(&mut registry.submission_hashes, submission_hash, true);

        // Emit event
        event::emit(SealMinted {
            seal_id,
            startup_name: seal.startup_name,
            owner: sender,
            trust_score: overall_trust_score,
            timestamp: seal.timestamp,
        });

        // Transfer seal to owner (NFT)
        transfer::transfer(seal, sender);
    }

    // ======= Security Functions =======

    /// Validate nonce to prevent replay attacks
    fun validate_nonce(registry: &SealRegistry, sender: address, nonce: u64) {
        if (vec_map::contains(&registry.nonces, &sender)) {
            let last_nonce = *vec_map::get(&registry.nonces, &sender);
            assert!(nonce > last_nonce, E_REPLAY_ATTACK);
        };
    }

    /// Validate unique submission
    fun validate_unique_submission(registry: &SealRegistry, submission_hash: &vector<u8>) {
        assert!(!vec_map::contains(&registry.submission_hashes, submission_hash), E_REPLAY_ATTACK);
    }

    /// Calculate weighted trust score
    fun calculate_trust_score(
        hackathon_score: u64,
        github_score: u64,
        ai_consistency_score: u64,
        document_score: u64
    ): u64 {
        // Weighted average:
        // Hackathon: 40%, GitHub: 30%, AI: 20%, Document: 10%
        let score = (
            (hackathon_score * 40) +
            (github_score * 30) +
            (ai_consistency_score * 20) +
            (document_score * 10)
        ) / 100;
        
        score
    }

    // ======= View Functions =======

    public fun get_trust_score(seal: &StartupSeal): u64 {
        seal.overall_trust_score
    }

    public fun get_startup_name(seal: &StartupSeal): String {
        seal.startup_name
    }

    public fun get_hackathon_name(seal: &StartupSeal): String {
        seal.hackathon_name
    }

    public fun is_verified(seal: &StartupSeal): bool {
        seal.hackathon_verified
    }

    public fun get_owner(seal: &StartupSeal): address {
        seal.owner
    }

    public fun get_document_hash(seal: &StartupSeal): vector<u8> {
        seal.document_hash
    }

    public fun get_scores(seal: &StartupSeal): (u64, u64, u64, u64, u64) {
        (
            seal.hackathon_score,
            seal.github_score,
            seal.ai_consistency_score,
            seal.document_score,
            seal.overall_trust_score
        )
    }

    // ======= Test Only =======
    #[test_only]
    public fun init_for_testing(ctx: &mut TxContext) {
        init(ctx);
    }
}
