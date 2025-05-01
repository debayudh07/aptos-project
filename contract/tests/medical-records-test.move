#[test_only]
module 0x8e46115deae69c3ffc41c50f29c94501935467de0212a666d2f0f0b83f1574ac::healthcare_tests {
    use std::signer;
    use std::string;
    use aptos_framework::timestamp;
    use aptos_framework::account;

    use 0x8e46115deae69c3ffc41c50f29c94501935467de0212a666d2f0f0b83f1574ac::healthcare;

    // ===== Test Functions =====
    #[test(provider = @0x8e46115deae69c3ffc41c50f29c94501935467de0212a666d2f0f0b83f1574ac, aptos_framework = @0x1)]
    public fun test_initialize(provider: signer, aptos_framework: signer) {
        // Create a provider account
        account::create_account_for_test(signer::address_of(&provider));
        
        // Initialize the provider
        healthcare::initialize_for_test(&provider);
        
        // Verify that ProviderRegistry exists
        let provider_addr = signer::address_of(&provider);
        assert!(healthcare::test_has_provider_registry(provider_addr), 0);
        
        // Verify that EventHandles exists
        assert!(healthcare::test_has_event_handles(provider_addr), 1);
        
        // Check initialization of empty vectors
        assert!(healthcare::test_patient_count(provider_addr) == 0, 2);
        assert!(healthcare::test_record_count(provider_addr) == 0, 3);
        assert!(healthcare::test_appointment_count(provider_addr) == 0, 4);
    }

    #[test(provider = @0x8e46115deae69c3ffc41c50f29c94501935467de0212a666d2f0f0b83f1574ac)]
    public fun test_add_patient(provider: signer) {
        // Setup
        account::create_account_for_test(signer::address_of(&provider));
        healthcare::initialize_for_test(&provider);
        
        // Add a patient
        let patient_id = string::utf8(b"PT001");
        let name = string::utf8(b"John Doe");
        let gender = string::utf8(b"Male");
        let contact = string::utf8(b"555-123-4567");
        let email = string::utf8(b"john.doe@example.com");
        let addr = string::utf8(b"123 Main St");
        let medical_history = string::utf8(b"No significant medical history");
        
        healthcare::add_patient(
            &provider,
            patient_id,
            name,
            35,
            gender,
            contact,
            email,
            addr,
            medical_history
        );
        
        // Verify patient was added
        let provider_addr = signer::address_of(&provider);
        assert!(healthcare::test_patient_count(provider_addr) == 1, 0);
        
        // Test patient field values
        assert!(healthcare::test_patient_matches(
            provider_addr,
            0,
            patient_id,
            name,
            35,
            gender,
            contact,
            email,
            addr,
            medical_history
        ), 1);
    }
    
    #[test(provider = @0x8e46115deae69c3ffc41c50f29c94501935467de0212a666d2f0f0b83f1574ac)]
    #[expected_failure(abort_code = 524291)]
    public fun test_add_duplicate_patient(provider: signer) {
        // Setup
        account::create_account_for_test(signer::address_of(&provider));
        healthcare::initialize_for_test(&provider);
        
        // Add a patient
        let patient_id = string::utf8(b"PT001");
        let name = string::utf8(b"John Doe");
        let gender = string::utf8(b"Male");
        let contact = string::utf8(b"555-123-4567");
        let email = string::utf8(b"john.doe@example.com");
        let addr = string::utf8(b"123 Main St");
        let medical_history = string::utf8(b"No significant medical history");
        
        healthcare::add_patient(
            &provider,
            patient_id,
            name,
            35,
            gender,
            contact,
            email,
            addr,
            medical_history
        );
        
        // Try adding a patient with the same ID, should fail
        healthcare::add_patient(
            &provider,
            patient_id,
            string::utf8(b"Jane Doe"),
            30,
            string::utf8(b"Female"),
            string::utf8(b"555-987-6543"),
            string::utf8(b"jane.doe@example.com"),
            string::utf8(b"456 Oak St"),
            string::utf8(b"No medical history")
        );
    }
    
    #[test(provider = @0x8e46115deae69c3ffc41c50f29c94501935467de0212a666d2f0f0b83f1574ac, aptos_framework = @0x1)]
    public fun test_add_medical_record(provider: signer, aptos_framework: signer) {
        // Setup
        account::create_account_for_test(signer::address_of(&provider));
        account::create_account_for_test(@0x1);
        
        // Initialize timestamp for testing
        timestamp::set_time_has_started_for_testing(&aptos_framework);
        timestamp::update_global_time_for_test(100000000);
        
        // Initialize healthcare provider
        healthcare::initialize_for_test(&provider);
        
        // Add a patient
        let patient_id = string::utf8(b"PT001");
        healthcare::add_patient(
            &provider,
            patient_id,
            string::utf8(b"John Doe"),
            35,
            string::utf8(b"Male"),
            string::utf8(b"555-123-4567"),
            string::utf8(b"john.doe@example.com"),
            string::utf8(b"123 Main St"),
            string::utf8(b"No significant medical history")
        );
        
        // Add a medical record
        let record_id = string::utf8(b"MR001");
        let record_type = string::utf8(b"Checkup");
        let diagnosis = string::utf8(b"Healthy");
        let treatment = string::utf8(b"None required");
        let notes = string::utf8(b"Routine checkup, all clear");
        
        healthcare::add_medical_record(
            &provider,
            record_id,
            patient_id,
            record_type,
            diagnosis,
            treatment,
            notes
        );
        
        // Verify record was added
        let provider_addr = signer::address_of(&provider);
        assert!(healthcare::test_record_count(provider_addr) == 1, 0);
        
        // Test record field values
        assert!(healthcare::test_record_matches(
            provider_addr,
            0,
            record_id,
            patient_id,
            record_type,
            diagnosis,
            treatment,
            notes
        ), 1);
    }
    
    #[test(provider = @0x8e46115deae69c3ffc41c50f29c94501935467de0212a666d2f0f0b83f1574ac, aptos_framework = @0x1)]
    #[expected_failure(abort_code = 393218)]
    public fun test_add_record_nonexistent_patient(provider: signer, aptos_framework: signer) {
        // Setup
        account::create_account_for_test(signer::address_of(&provider));
        account::create_account_for_test(@0x1);
        
        // Initialize timestamp for testing
        timestamp::set_time_has_started_for_testing(&aptos_framework);
        
        // Initialize provider
        healthcare::initialize_for_test(&provider);
        
        // Add a medical record for a non-existent patient
        healthcare::add_medical_record(
            &provider,
            string::utf8(b"MR001"),
            string::utf8(b"NONEXISTENT"),
            string::utf8(b"Checkup"),
            string::utf8(b"Healthy"),
            string::utf8(b"None"),
            string::utf8(b"Notes")
        );
    }
    
    #[test(provider = @0x8e46115deae69c3ffc41c50f29c94501935467de0212a666d2f0f0b83f1574ac)]
    public fun test_schedule_appointment(provider: signer) {
        // Setup
        account::create_account_for_test(signer::address_of(&provider));
        healthcare::initialize_for_test(&provider);
        
        // Add a patient
        let patient_id = string::utf8(b"PT001");
        healthcare::add_patient(
            &provider,
            patient_id,
            string::utf8(b"John Doe"),
            35,
            string::utf8(b"Male"),
            string::utf8(b"555-123-4567"),
            string::utf8(b"john.doe@example.com"),
            string::utf8(b"123 Main St"),
            string::utf8(b"No significant medical history")
        );
        
        // Schedule an appointment
        let appointment_id = string::utf8(b"APT001");
        let date = string::utf8(b"2025-05-01");
        let time = string::utf8(b"14:00");
        let purpose = string::utf8(b"Annual checkup");
        let status = string::utf8(b"scheduled");
        
        healthcare::schedule_appointment(
            &provider,
            appointment_id,
            patient_id,
            date,
            time,
            purpose,
            status
        );
        
        // Verify appointment was scheduled
        let provider_addr = signer::address_of(&provider);
        assert!(healthcare::test_appointment_count(provider_addr) == 1, 0);
        
        // Test appointment field values
        assert!(healthcare::test_appointment_matches(
            provider_addr,
            0,
            appointment_id,
            patient_id,
            date,
            time,
            purpose,
            status
        ), 1);
    }
    
    #[test(provider = @0x8e46115deae69c3ffc41c50f29c94501935467de0212a666d2f0f0b83f1574ac)]
    public fun test_update_appointment_status(provider: signer) {
        // Setup
        account::create_account_for_test(signer::address_of(&provider));
        healthcare::initialize_for_test(&provider);
        
        // Add a patient
        let patient_id = string::utf8(b"PT001");
        healthcare::add_patient(
            &provider,
            patient_id,
            string::utf8(b"John Doe"),
            35,
            string::utf8(b"Male"),
            string::utf8(b"555-123-4567"),
            string::utf8(b"john.doe@example.com"),
            string::utf8(b"123 Main St"),
            string::utf8(b"No significant medical history")
        );
        
        // Schedule an appointment
        let appointment_id = string::utf8(b"APT001");
        healthcare::schedule_appointment(
            &provider,
            appointment_id,
            patient_id,
            string::utf8(b"2025-05-01"),
            string::utf8(b"14:00"),
            string::utf8(b"Annual checkup"),
            string::utf8(b"scheduled")
        );
        
        // Update appointment status
        let new_status = string::utf8(b"completed");
        healthcare::update_appointment_status(&provider, appointment_id, new_status);
        
        // Verify status was updated
        let provider_addr = signer::address_of(&provider);
        let status = healthcare::test_get_appointment_status(provider_addr, 0);
        assert!(status == new_status, 0);
    }
    
    #[test(provider = @0x8e46115deae69c3ffc41c50f29c94501935467de0212a666d2f0f0b83f1574ac)]
    #[expected_failure(abort_code = 393221)]
    public fun test_update_nonexistent_appointment(provider: signer) {
        // Setup
        account::create_account_for_test(signer::address_of(&provider));
        healthcare::initialize_for_test(&provider);
        
        // Try to update a non-existent appointment
        healthcare::update_appointment_status(
            &provider,
            string::utf8(b"NONEXISTENT"),
            string::utf8(b"completed")
        );
    }
    
    #[test(provider = @0x8e46115deae69c3ffc41c50f29c94501935467de0212a666d2f0f0b83f1574ac)]
    public fun test_update_patient(provider: signer) {
        // Setup
        account::create_account_for_test(signer::address_of(&provider));
        healthcare::initialize_for_test(&provider);
        
        // Add a patient
        let patient_id = string::utf8(b"PT001");
        healthcare::add_patient(
            &provider,
            patient_id,
            string::utf8(b"John Doe"),
            35,
            string::utf8(b"Male"),
            string::utf8(b"555-123-4567"),
            string::utf8(b"john.doe@example.com"),
            string::utf8(b"123 Main St"),
            string::utf8(b"No significant medical history")
        );
        
        // Update patient information
        let new_name = string::utf8(b"John Smith");
        let new_age = 36;
        let new_contact = string::utf8(b"555-987-6543");
        let new_email = string::utf8(b"john.smith@example.com");
        let new_addr = string::utf8(b"456 Oak St");
        let new_medical_history = string::utf8(b"Updated medical history");
        
        healthcare::update_patient(
            &provider,
            patient_id,
            new_name,
            new_age,
            new_contact,
            new_email,
            new_addr,
            new_medical_history
        );
        
        // Verify patient was updated
        let provider_addr = signer::address_of(&provider);
        assert!(healthcare::test_patient_has_fields(provider_addr, 0, string::utf8(b"name"), new_name), 0);
        assert!(healthcare::test_patient_has_fields(provider_addr, 0, string::utf8(b"contact"), new_contact), 2);
        assert!(healthcare::test_patient_has_fields(provider_addr, 0, string::utf8(b"email"), new_email), 3);
        assert!(healthcare::test_patient_has_fields(provider_addr, 0, string::utf8(b"address"), new_addr), 4);
        assert!(healthcare::test_patient_has_fields(provider_addr, 0, string::utf8(b"medical_history"), new_medical_history), 5);
        // Gender should remain unchanged
        assert!(healthcare::test_patient_has_fields(provider_addr, 0, string::utf8(b"gender"), string::utf8(b"Male")), 6);
    }
    
    #[test(provider = @0x8e46115deae69c3ffc41c50f29c94501935467de0212a666d2f0f0b83f1574ac)]
    #[expected_failure(abort_code = 393218)]
    public fun test_update_nonexistent_patient(provider: signer) {
        // Setup
        account::create_account_for_test(signer::address_of(&provider));
        healthcare::initialize_for_test(&provider);
        
        // Try to update a non-existent patient
        healthcare::update_patient(
            &provider,
            string::utf8(b"NONEXISTENT"),
            string::utf8(b"John Smith"),
            36,
            string::utf8(b"555-987-6543"),
            string::utf8(b"john.smith@example.com"),
            string::utf8(b"456 Oak St"),
            string::utf8(b"Updated medical history")
        );
    }
    
    #[test(provider = @0x8e46115deae69c3ffc41c50f29c94501935467de0212a666d2f0f0b83f1574ac)]
    public fun test_get_patients(provider: signer) {
        // Setup
        account::create_account_for_test(signer::address_of(&provider));
        healthcare::initialize_for_test(&provider);
        
        // Add multiple patients
        healthcare::add_patient(
            &provider,
            string::utf8(b"PT001"),
            string::utf8(b"John Doe"),
            35,
            string::utf8(b"Male"),
            string::utf8(b"555-123-4567"),
            string::utf8(b"john.doe@example.com"),
            string::utf8(b"123 Main St"),
            string::utf8(b"No significant medical history")
        );
        
        healthcare::add_patient(
            &provider,
            string::utf8(b"PT002"),
            string::utf8(b"Jane Doe"),
            30,
            string::utf8(b"Female"),
            string::utf8(b"555-987-6543"),
            string::utf8(b"jane.doe@example.com"),
            string::utf8(b"456 Oak St"),
            string::utf8(b"No medical history")
        );
        
        // Get patients
        let provider_addr = signer::address_of(&provider);
        let patients = healthcare::get_patients(provider_addr);
        
        // Verify correct patients were returned
        assert!(std::vector::length(&patients) == 2, 0);
        
        // Check first patient
        assert!(healthcare::test_patient_has_fields(provider_addr, 0, string::utf8(b"id"), string::utf8(b"PT001")), 1);
        assert!(healthcare::test_patient_has_fields(provider_addr, 0, string::utf8(b"name"), string::utf8(b"John Doe")), 2);
        
        // Check second patient
        assert!(healthcare::test_patient_has_fields(provider_addr, 1, string::utf8(b"id"), string::utf8(b"PT002")), 3);
        assert!(healthcare::test_patient_has_fields(provider_addr, 1, string::utf8(b"name"), string::utf8(b"Jane Doe")), 4);
    }
    
    #[test(provider = @0x8e46115deae69c3ffc41c50f29c94501935467de0212a666d2f0f0b83f1574ac, aptos_framework = @0x1)]
    public fun test_get_patient_records(provider: signer, aptos_framework: signer) {
        // Setup
        account::create_account_for_test(signer::address_of(&provider));
        account::create_account_for_test(@0x1);
        
        // Initialize timestamp for testing
        timestamp::set_time_has_started_for_testing(&aptos_framework);
        timestamp::update_global_time_for_test(100000000);
        
        // Initialize provider
        healthcare::initialize_for_test(&provider);
        
        // Add a patient
        let patient_id = string::utf8(b"PT001");
        healthcare::add_patient(
            &provider,
            patient_id,
            string::utf8(b"John Doe"),
            35,
            string::utf8(b"Male"),
            string::utf8(b"555-123-4567"),
            string::utf8(b"john.doe@example.com"),
            string::utf8(b"123 Main St"),
            string::utf8(b"No significant medical history")
        );
        
        // Add multiple records
        healthcare::add_medical_record(
            &provider,
            string::utf8(b"MR001"),
            patient_id,
            string::utf8(b"Checkup"),
            string::utf8(b"Healthy"),
            string::utf8(b"None required"),
            string::utf8(b"Routine checkup, all clear")
        );
        
        healthcare::add_medical_record(
            &provider,
            string::utf8(b"MR002"),
            patient_id,
            string::utf8(b"Lab Test"),
            string::utf8(b"Normal results"),
            string::utf8(b"No treatment needed"),
            string::utf8(b"Blood work done")
        );
        
        // Get patient records
        let provider_addr = signer::address_of(&provider);
        let records = healthcare::get_patient_records(provider_addr, patient_id);
        
        // Verify correct records were returned
        assert!(std::vector::length(&records) == 2, 0);
        
        // Test record match functions to verify the two records exist with correct data
        assert!(healthcare::test_record_matches(
            provider_addr,
            0,
            string::utf8(b"MR001"),
            patient_id,
            string::utf8(b"Checkup"),
            string::utf8(b"Healthy"),
            string::utf8(b"None required"),
            string::utf8(b"Routine checkup, all clear")
        ), 1);
        
        assert!(healthcare::test_record_matches(
            provider_addr,
            1,
            string::utf8(b"MR002"),
            patient_id,
            string::utf8(b"Lab Test"),
            string::utf8(b"Normal results"),
            string::utf8(b"No treatment needed"),
            string::utf8(b"Blood work done") 
        ), 2);
    }
    
    #[test(provider = @0x8e46115deae69c3ffc41c50f29c94501935467de0212a666d2f0f0b83f1574ac)]
    public fun test_get_patient_appointments(provider: signer) {
        // Setup
        account::create_account_for_test(signer::address_of(&provider));
        healthcare::initialize_for_test(&provider);
        
        // Add a patient
        let patient_id = string::utf8(b"PT001");
        healthcare::add_patient(
            &provider,
            patient_id,
            string::utf8(b"John Doe"),
            35,
            string::utf8(b"Male"),
            string::utf8(b"555-123-4567"),
            string::utf8(b"john.doe@example.com"),
            string::utf8(b"123 Main St"),
            string::utf8(b"No significant medical history")
        );
        
        // Schedule multiple appointments
        healthcare::schedule_appointment(
            &provider,
            string::utf8(b"APT001"),
            patient_id,
            string::utf8(b"2025-05-01"),
            string::utf8(b"14:00"),
            string::utf8(b"Annual checkup"),
            string::utf8(b"scheduled")
        );
        
        healthcare::schedule_appointment(
            &provider,
            string::utf8(b"APT002"),
            patient_id,
            string::utf8(b"2025-06-15"),
            string::utf8(b"10:30"),
            string::utf8(b"Follow-up"),
            string::utf8(b"scheduled")
        );
        
        // Get patient appointments
        let provider_addr = signer::address_of(&provider);
        let appointments = healthcare::get_patient_appointments(provider_addr, patient_id);
        
        // Verify correct appointments were returned
        assert!(std::vector::length(&appointments) == 2, 0);
        
        // Test appointment matches for both appointments
        assert!(healthcare::test_appointment_matches(
            provider_addr,
            0,
            string::utf8(b"APT001"),
            patient_id,
            string::utf8(b"2025-05-01"),
            string::utf8(b"14:00"),
            string::utf8(b"Annual checkup"),
            string::utf8(b"scheduled")
        ), 1);
        
        assert!(healthcare::test_appointment_matches(
            provider_addr,
            1,
            string::utf8(b"APT002"),
            patient_id,
            string::utf8(b"2025-06-15"),
            string::utf8(b"10:30"),
            string::utf8(b"Follow-up"),
            string::utf8(b"scheduled")
        ), 2);
    }
    
    #[test(provider = @0x8e46115deae69c3ffc41c50f29c94501935467de0212a666d2f0f0b83f1574ac, user = @0x123)]
    #[expected_failure(abort_code = 393217)]
    public fun test_unauthorized_access(provider: signer, user: signer) {
        // Setup
        account::create_account_for_test(signer::address_of(&provider));
        account::create_account_for_test(signer::address_of(&user));
        healthcare::initialize_for_test(&provider);
        
        // Try to add a patient from unauthorized account
        healthcare::add_patient(
            &user,
            string::utf8(b"PT001"),
            string::utf8(b"John Doe"),
            35,
            string::utf8(b"Male"),
            string::utf8(b"555-123-4567"),
            string::utf8(b"john.doe@example.com"),
            string::utf8(b"123 Main St"),
            string::utf8(b"No significant medical history")
        );
    }
}