#[test_only]
module trust_engine::startup_trust_record_tests {
    use trust_engine::startup_trust_record::{Self, StartupTrustRecord, AdminCap, TrustRegistry};
    use sui::test_scenario;
    use sui::clock;
    use std::string;

    const ADMIN: address = @0xAD;
    const STARTUP: address = @0x123;
    const INVESTOR: address = @0x456;

    #[test]
    fun test_submit_record() {
        let mut scenario = test_scenario::begin(ADMIN);
        
        // Initialize module
        {
            startup_trust_record::init_for_testing(test_scenario::ctx(&mut scenario));
        };

        // Setup clock
        test_scenario::next_tx(&mut scenario, ADMIN);
        let mut clock = clock::create_for_testing(test_scenario::ctx(&mut scenario));
        clock::set_for_testing(&mut clock, 1000000);

        // Submit record
        test_scenario::next_tx(&mut scenario, STARTUP);
        {
            let mut registry = test_scenario::take_shared<TrustRegistry>(&scenario);
            
            startup_trust_record::submit_record(
                &mut registry,
                b"Test Startup",
                b"blob_123456",
                b"quilt_789012",
                85,
                x"abcdef",
                40,
                40,
                20,
                &clock,
                test_scenario::ctx(&mut scenario)
            );

            test_scenario::return_shared(registry);
        };

        // Verify record was created
        test_scenario::next_tx(&mut scenario, STARTUP);
        {
            let record = test_scenario::take_from_sender<StartupTrustRecord>(&scenario);
            
            assert!(startup_trust_record::get_trust_score(&record) == 85, 0);
            assert!(string::bytes(&startup_trust_record::get_startup_name(&record)) == &b"Test Startup", 1);
            assert!(string::bytes(&startup_trust_record::get_blob_id(&record)) == &b"blob_123456", 2);
            assert!(!startup_trust_record::is_verified(&record), 3);

            test_scenario::return_to_sender(&scenario, record);
        };

        clock::destroy_for_testing(clock);
        test_scenario::end(scenario);
    }

    #[test]
    fun test_update_score() {
        let mut scenario = test_scenario::begin(ADMIN);
        
        // Initialize
        {
            startup_trust_record::init_for_testing(test_scenario::ctx(&mut scenario));
        };

        test_scenario::next_tx(&mut scenario, ADMIN);
        let mut clock = clock::create_for_testing(test_scenario::ctx(&mut scenario));
        clock::set_for_testing(&mut clock, 1000000);

        // Submit initial record
        test_scenario::next_tx(&mut scenario, STARTUP);
        {
            let mut registry = test_scenario::take_shared<TrustRegistry>(&scenario);
            
            startup_trust_record::submit_record(
                &mut registry,
                b"Test Startup",
                b"blob_123456",
                b"quilt_789012",
                70,
                x"abcdef",
                30,
                30,
                10,
                &clock,
                test_scenario::ctx(&mut scenario)
            );

            test_scenario::return_shared(registry);
        };

        // Transfer record to ADMIN for update
        test_scenario::next_tx(&mut scenario, STARTUP);
        {
            let record = test_scenario::take_from_sender<StartupTrustRecord>(&scenario);
            transfer::public_transfer(record, ADMIN);
        };

        // Update score with AdminCap
        test_scenario::next_tx(&mut scenario, ADMIN);
        {
            let admin_cap = test_scenario::take_from_sender<AdminCap>(&scenario);
            let mut record = test_scenario::take_from_sender<StartupTrustRecord>(&scenario);

            startup_trust_record::update_score(
                &admin_cap,
                &mut record,
                90,
                45,
                35,
                20,
                x"newverificationhash",
                &clock,
                test_scenario::ctx(&mut scenario)
            );

            assert!(startup_trust_record::get_trust_score(&record) == 90, 0);
            assert!(startup_trust_record::get_version(&record) == 2, 1);

            test_scenario::return_to_sender(&scenario, admin_cap);
            test_scenario::return_to_sender(&scenario, record);
        };

        clock::destroy_for_testing(clock);
        test_scenario::end(scenario);
    }

    #[test]
    fun test_verify_record() {
        let mut scenario = test_scenario::begin(ADMIN);
        
        // Initialize
        {
            startup_trust_record::init_for_testing(test_scenario::ctx(&mut scenario));
        };

        test_scenario::next_tx(&mut scenario, ADMIN);
        let mut clock = clock::create_for_testing(test_scenario::ctx(&mut scenario));
        clock::set_for_testing(&mut clock, 1000000);

        // Submit record
        test_scenario::next_tx(&mut scenario, STARTUP);
        {
            let mut registry = test_scenario::take_shared<TrustRegistry>(&scenario);
            
            startup_trust_record::submit_record(
                &mut registry,
                b"Test Startup",
                b"blob_123456",
                b"quilt_789012",
                80,
                x"abcdef",
                40,
                30,
                20,
                &clock,
                test_scenario::ctx(&mut scenario)
            );

            test_scenario::return_shared(registry);
        };

        // Transfer to investor
        test_scenario::next_tx(&mut scenario, STARTUP);
        {
            let record = test_scenario::take_from_sender<StartupTrustRecord>(&scenario);
            transfer::public_transfer(record, INVESTOR);
        };

        // Investor verifies
        test_scenario::next_tx(&mut scenario, INVESTOR);
        {
            let mut registry = test_scenario::take_shared<TrustRegistry>(&scenario);
            let mut record = test_scenario::take_from_sender<StartupTrustRecord>(&scenario);

            assert!(!startup_trust_record::is_verified(&record), 0);

            startup_trust_record::verify_record(
                &mut registry,
                &mut record,
                &clock,
                test_scenario::ctx(&mut scenario)
            );

            assert!(startup_trust_record::is_verified(&record), 1);

            test_scenario::return_shared(registry);
            test_scenario::return_to_sender(&scenario, record);
        };

        clock::destroy_for_testing(clock);
        test_scenario::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = startup_trust_record::EInvalidScore)]
    fun test_invalid_score() {
        let mut scenario = test_scenario::begin(ADMIN);
        
        {
            startup_trust_record::init_for_testing(test_scenario::ctx(&mut scenario));
        };

        test_scenario::next_tx(&mut scenario, ADMIN);
        let mut clock = clock::create_for_testing(test_scenario::ctx(&mut scenario));

        test_scenario::next_tx(&mut scenario, STARTUP);
        {
            let mut registry = test_scenario::take_shared<TrustRegistry>(&scenario);
            
            // Try to submit with score > 100
            startup_trust_record::submit_record(
                &mut registry,
                b"Test Startup",
                b"blob_123456",
                b"quilt_789012",
                150, // Invalid!
                x"abcdef",
                40,
                40,
                20,
                &clock,
                test_scenario::ctx(&mut scenario)
            );

            test_scenario::return_shared(registry);
        };

        clock::destroy_for_testing(clock);
        test_scenario::end(scenario);
    }
}
