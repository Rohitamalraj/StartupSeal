module trust_engine::startup_trust_record {
    use sui::object::{Self, UID};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use sui::event;
    use std::string::{Self, String};
    use sui::vec_map::{Self, VecMap};
    use sui::clock::{Self, Clock};

    // ======= Error Codes =======
    const EInvalidScore: u64 = 1;
    const EUnauthorized: u64 = 2;
    const EInvalidBlobId: u64 = 3;
    const ERecordNotFound: u64 = 4;

    // ======= Constants =======
    const MAX_TRUST_SCORE: u64 = 100;
    const MIN_TRUST_SCORE: u64 = 0;

    // ======= Structs =======

    /// Main trust record object stored on-chain
    public struct StartupTrustRecord has key, store {
        id: UID,
        startup_name: String,
        walrus_blob_id: String,
        walrus_quilt_id: String,
        trust_score: u64,
        ai_verification_hash: vector<u8>,
        reviewer_address: address,
        timestamp: u64,
        metadata: VecMap<String, String>,
        version: u64,
        is_verified: bool,
        on_chain_score: u64,
        off_chain_score: u64,
        ai_score: u64,
    }

    /// Admin capability for authorized operations
    public struct AdminCap has key, store {
        id: UID,
    }

    /// Registry to track all trust records
    public struct TrustRegistry has key {
        id: UID,
        total_records: u64,
        total_verified: u64,
    }

    // ======= Events =======

    public struct TrustRecordCreated has copy, drop {
        record_id: address,
        startup_name: String,
        walrus_blob_id: String,
        reviewer_address: address,
        timestamp: u64,
    }

    public struct TrustScoreUpdated has copy, drop {
        record_id: address,
        old_score: u64,
        new_score: u64,
        updated_by: address,
        timestamp: u64,
    }

    public struct RecordVerified has copy, drop {
        record_id: address,
        verified_by: address,
        timestamp: u64,
    }

    // ======= Initialization =======

    /// Initialize the module, create admin capability and registry
    fun init(ctx: &mut TxContext) {
        // Create admin capability for deployer
        let admin_cap = AdminCap {
            id: object::new(ctx),
        };
        transfer::transfer(admin_cap, tx_context::sender(ctx));

        // Create trust registry
        let registry = TrustRegistry {
            id: object::new(ctx),
            total_records: 0,
            total_verified: 0,
        };
        transfer::share_object(registry);
    }

    // ======= Entry Functions =======

    /// Submit a new trust record
    /// Called after Walrus upload and initial AI analysis
    public entry fun submit_record(
        registry: &mut TrustRegistry,
        startup_name: vector<u8>,
        walrus_blob_id: vector<u8>,
        walrus_quilt_id: vector<u8>,
        trust_score: u64,
        ai_verification_hash: vector<u8>,
        on_chain_score: u64,
        off_chain_score: u64,
        ai_score: u64,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        // Validate inputs
        assert!(trust_score <= MAX_TRUST_SCORE, EInvalidScore);
        assert!(on_chain_score <= MAX_TRUST_SCORE, EInvalidScore);
        assert!(off_chain_score <= MAX_TRUST_SCORE, EInvalidScore);
        assert!(ai_score <= MAX_TRUST_SCORE, EInvalidScore);

        let sender = tx_context::sender(ctx);
        let timestamp = clock::timestamp_ms(clock);

        // Create metadata map
        let metadata = vec_map::empty<String, String>();
        
        // Create trust record
        let record = StartupTrustRecord {
            id: object::new(ctx),
            startup_name: string::utf8(startup_name),
            walrus_blob_id: string::utf8(walrus_blob_id),
            walrus_quilt_id: string::utf8(walrus_quilt_id),
            trust_score,
            ai_verification_hash,
            reviewer_address: sender,
            timestamp,
            metadata,
            version: 1,
            is_verified: false,
            on_chain_score,
            off_chain_score,
            ai_score,
        };

        let record_id = object::uid_to_address(&record.id);

        // Emit event
        event::emit(TrustRecordCreated {
            record_id,
            startup_name: record.startup_name,
            walrus_blob_id: record.walrus_blob_id,
            reviewer_address: sender,
            timestamp,
        });

        // Update registry
        registry.total_records = registry.total_records + 1;

        // Transfer ownership to sender
        transfer::transfer(record, sender);
    }

    /// Update trust score (admin only)
    public entry fun update_score(
        _admin: &AdminCap,
        record: &mut StartupTrustRecord,
        new_trust_score: u64,
        new_on_chain_score: u64,
        new_off_chain_score: u64,
        new_ai_score: u64,
        new_ai_hash: vector<u8>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        assert!(new_trust_score <= MAX_TRUST_SCORE, EInvalidScore);
        assert!(new_on_chain_score <= MAX_TRUST_SCORE, EInvalidScore);
        assert!(new_off_chain_score <= MAX_TRUST_SCORE, EInvalidScore);
        assert!(new_ai_score <= MAX_TRUST_SCORE, EInvalidScore);

        let old_score = record.trust_score;
        let sender = tx_context::sender(ctx);
        let timestamp = clock::timestamp_ms(clock);

        // Update record
        record.trust_score = new_trust_score;
        record.on_chain_score = new_on_chain_score;
        record.off_chain_score = new_off_chain_score;
        record.ai_score = new_ai_score;
        record.ai_verification_hash = new_ai_hash;
        record.version = record.version + 1;

        // Emit event
        event::emit(TrustScoreUpdated {
            record_id: object::uid_to_address(&record.id),
            old_score,
            new_score: new_trust_score,
            updated_by: sender,
            timestamp,
        });
    }

    /// Verify a record (marks as verified)
    public entry fun verify_record(
        registry: &mut TrustRegistry,
        record: &mut StartupTrustRecord,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        let timestamp = clock::timestamp_ms(clock);

        if (!record.is_verified) {
            record.is_verified = true;
            registry.total_verified = registry.total_verified + 1;

            event::emit(RecordVerified {
                record_id: object::uid_to_address(&record.id),
                verified_by: sender,
                timestamp,
            });
        };
    }

    /// Add metadata to a record
    public entry fun add_metadata(
        record: &mut StartupTrustRecord,
        key: vector<u8>,
        value: vector<u8>,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        assert!(sender == record.reviewer_address, EUnauthorized);
        
        vec_map::insert(
            &mut record.metadata,
            string::utf8(key),
            string::utf8(value)
        );
    }

    // ======= View Functions =======

    /// Get trust score
    public fun get_trust_score(record: &StartupTrustRecord): u64 {
        record.trust_score
    }

    /// Get startup name
    public fun get_startup_name(record: &StartupTrustRecord): String {
        record.startup_name
    }

    /// Get Walrus blob ID
    public fun get_blob_id(record: &StartupTrustRecord): String {
        record.walrus_blob_id
    }

    /// Get Walrus quilt ID
    public fun get_quilt_id(record: &StartupTrustRecord): String {
        record.walrus_quilt_id
    }

    /// Get verification hash
    public fun get_verification_hash(record: &StartupTrustRecord): vector<u8> {
        record.ai_verification_hash
    }

    /// Get timestamp
    public fun get_timestamp(record: &StartupTrustRecord): u64 {
        record.timestamp
    }

    /// Check if verified
    public fun is_verified(record: &StartupTrustRecord): bool {
        record.is_verified
    }

    /// Get component scores
    public fun get_component_scores(record: &StartupTrustRecord): (u64, u64, u64) {
        (record.on_chain_score, record.off_chain_score, record.ai_score)
    }

    /// Get reviewer address
    public fun get_reviewer(record: &StartupTrustRecord): address {
        record.reviewer_address
    }

    /// Get version
    public fun get_version(record: &StartupTrustRecord): u64 {
        record.version
    }

    // ======= Test Functions =======

    #[test_only]
    public fun init_for_testing(ctx: &mut TxContext) {
        init(ctx);
    }
}
