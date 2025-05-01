module 0x8e46115deae69c3ffc41c50f29c94501935467de0212a666d2f0f0b83f1574ac::healthcare {
    use std::error;
    use std::signer;
    use std::string::{Self, String};
    use std::vector;
    use aptos_framework::account;
    use aptos_framework::event;
    use aptos_framework::timestamp;

    /// Error codes
    const ENO_PERMISSIONS: u64 = 1;
    const EPATIENT_NOT_FOUND: u64 = 2;
    const EPATIENT_ALREADY_EXISTS: u64 = 3;
    const ERECORD_NOT_FOUND: u64 = 4;
    const EAPPOINTMENT_NOT_FOUND: u64 = 5;

    /// Patient struct to store patient information
    struct Patient has key, store, drop, copy {
        id: String,
        name: String,
        age: u8,
        gender: String,
        contact: String,
        email: String,
        address: String,
        medical_history: String,
    }

    /// Medical record struct
    struct MedicalRecord has store, drop, copy {
        id: String,
        patient_id: String,
        date: u64,  // timestamp
        record_type: String,
        diagnosis: String,
        treatment: String,
        notes: String,
    }

    /// Appointment struct
    struct Appointment has store, drop, copy {
        id: String,
        patient_id: String,
        date: String,
        time: String,
        purpose: String,
        status: String, // "scheduled", "completed", "cancelled"
    }

    /// Resources stored under healthcare provider account
    struct ProviderRegistry has key {
        patients: vector<Patient>,
        medical_records: vector<MedicalRecord>,
        appointments: vector<Appointment>,
    }

    /// Events
    struct PatientAddedEvent has drop, store {
        patient_id: String,
        name: String,
    }

    struct RecordAddedEvent has drop, store {
        record_id: String,
        patient_id: String,
    }

    struct AppointmentScheduledEvent has drop, store {
        appointment_id: String,
        patient_id: String,
        date: String,
        time: String,
    }

    /// Event handles
    struct EventHandles has key {
        patient_added_events: event::EventHandle<PatientAddedEvent>,
        record_added_events: event::EventHandle<RecordAddedEvent>,
        appointment_scheduled_events: event::EventHandle<AppointmentScheduledEvent>,
    }

    // === Module Functions ===

    /// Initialize healthcare provider
    public entry fun initialize(provider: &signer) {
        let provider_addr = signer::address_of(provider);
        
        // Check if provider already initialized
        if (!exists<ProviderRegistry>(provider_addr)) {
            move_to(provider, ProviderRegistry {
                patients: vector::empty<Patient>(),
                medical_records: vector::empty<MedicalRecord>(),
                appointments: vector::empty<Appointment>(),
            });
            
            move_to(provider, EventHandles {
                patient_added_events: account::new_event_handle<PatientAddedEvent>(provider),
                record_added_events: account::new_event_handle<RecordAddedEvent>(provider),
                appointment_scheduled_events: account::new_event_handle<AppointmentScheduledEvent>(provider),
            });
        }
    }

    /// Add a new patient
    public entry fun add_patient(
        provider: &signer,
        patient_id: String,
        name: String,
        age: u8,
        gender: String,
        contact: String,
        email: String,
        address: String,
        medical_history: String,
    ) acquires ProviderRegistry, EventHandles {
        let provider_addr = signer::address_of(provider);
        
        // Check if provider registry exists
        assert!(exists<ProviderRegistry>(provider_addr), error::not_found(ENO_PERMISSIONS));
        
        let registry = borrow_global_mut<ProviderRegistry>(provider_addr);
        
        // Check if patient already exists
        let len = vector::length(&registry.patients);
        let i = 0;
        while (i < len) {
            let patient = vector::borrow(&registry.patients, i);
            assert!(&patient.id != &patient_id, error::already_exists(EPATIENT_ALREADY_EXISTS));
            i = i + 1;
        };
        
        // Create and add the new patient
        let new_patient = Patient {
            id: patient_id,
            name,
            age,
            gender,
            contact,
            email,
            address,
            medical_history,
        };
        
        vector::push_back(&mut registry.patients, new_patient);
        
        // Emit event
        let event_handles = borrow_global_mut<EventHandles>(provider_addr);
        event::emit_event(&mut event_handles.patient_added_events, PatientAddedEvent {
            patient_id,
            name,
        });
    }

    /// Add a medical record for a patient
    public entry fun add_medical_record(
        provider: &signer,
        record_id: String,
        patient_id: String,
        record_type: String,
        diagnosis: String,
        treatment: String,
        notes: String,
    ) acquires ProviderRegistry, EventHandles {
        let provider_addr = signer::address_of(provider);
        
        // Check if provider registry exists
        assert!(exists<ProviderRegistry>(provider_addr), error::not_found(ENO_PERMISSIONS));
        
        let registry = borrow_global_mut<ProviderRegistry>(provider_addr);
        
        // Verify patient exists
        let patient_exists = false;
        let len = vector::length(&registry.patients);
        let i = 0;
        while (i < len) {
            let patient = vector::borrow(&registry.patients, i);
            if (&patient.id == &patient_id) {
                patient_exists = true;
                break
            };
            i = i + 1;
        };
        
        assert!(patient_exists, error::not_found(EPATIENT_NOT_FOUND));
        
        // Create and add the medical record
        let new_record = MedicalRecord {
            id: record_id,
            patient_id,
            date: timestamp::now_seconds(), // Current timestamp
            record_type,
            diagnosis,
            treatment,
            notes,
        };
        
        vector::push_back(&mut registry.medical_records, new_record);
        
        // Emit event
        let event_handles = borrow_global_mut<EventHandles>(provider_addr);
        event::emit_event(&mut event_handles.record_added_events, RecordAddedEvent {
            record_id,
            patient_id,
        });
    }

    /// Schedule an appointment for a patient
    public entry fun schedule_appointment(
        provider: &signer,
        appointment_id: String,
        patient_id: String,
        date: String,
        time: String,
        purpose: String,
        status: String,
    ) acquires ProviderRegistry, EventHandles {
        let provider_addr = signer::address_of(provider);
        
        // Check if provider registry exists
        assert!(exists<ProviderRegistry>(provider_addr), error::not_found(ENO_PERMISSIONS));
        
        let registry = borrow_global_mut<ProviderRegistry>(provider_addr);
        
        // Verify patient exists
        let patient_exists = false;
        let len = vector::length(&registry.patients);
        let i = 0;
        while (i < len) {
            let patient = vector::borrow(&registry.patients, i);
            if (&patient.id == &patient_id) {
                patient_exists = true;
                break
            };
            i = i + 1;
        };
        
        assert!(patient_exists, error::not_found(EPATIENT_NOT_FOUND));
        
        // Create and add the appointment
        let new_appointment = Appointment {
            id: appointment_id,
            patient_id,
            date,
            time,
            purpose,
            status,
        };
        
        vector::push_back(&mut registry.appointments, new_appointment);
        
        // Emit event
        let event_handles = borrow_global_mut<EventHandles>(provider_addr);
        event::emit_event(&mut event_handles.appointment_scheduled_events, AppointmentScheduledEvent {
            appointment_id,
            patient_id,
            date,
            time,
        });
    }

    /// Get all patients (view function)
    #[view]
    public fun get_patients(provider_addr: address): vector<Patient> acquires ProviderRegistry {
        assert!(exists<ProviderRegistry>(provider_addr), error::not_found(ENO_PERMISSIONS));
        
        let registry = borrow_global<ProviderRegistry>(provider_addr);
        let patients_copy = vector::empty<Patient>();
        
        let len = vector::length(&registry.patients);
        let i = 0;
        while (i < len) {
            let patient = vector::borrow(&registry.patients, i);
            vector::push_back(&mut patients_copy, *patient);
            i = i + 1;
        };
        
        patients_copy
    }

    /// Get patient records (view function)
    #[view]
    public fun get_patient_records(provider_addr: address, patient_id: String): vector<MedicalRecord> acquires ProviderRegistry {
        assert!(exists<ProviderRegistry>(provider_addr), error::not_found(ENO_PERMISSIONS));
        
        let registry = borrow_global<ProviderRegistry>(provider_addr);
        let patient_records = vector::empty<MedicalRecord>();
        
        let len = vector::length(&registry.medical_records);
        let i = 0;
        while (i < len) {
            let record = vector::borrow(&registry.medical_records, i);
            if (&record.patient_id == &patient_id) {
                vector::push_back(&mut patient_records, *record);
            };
            i = i + 1;
        };
        
        patient_records
    }

    /// Get patient appointments (view function)
    #[view]
    public fun get_patient_appointments(provider_addr: address, patient_id: String): vector<Appointment> acquires ProviderRegistry {
        assert!(exists<ProviderRegistry>(provider_addr), error::not_found(ENO_PERMISSIONS));
        
        let registry = borrow_global<ProviderRegistry>(provider_addr);
        let patient_appointments = vector::empty<Appointment>();
        
        let len = vector::length(&registry.appointments);
        let i = 0;
        while (i < len) {
            let appointment = vector::borrow(&registry.appointments, i);
            if (&appointment.patient_id == &patient_id) {
                vector::push_back(&mut patient_appointments, *appointment);
            };
            i = i + 1;
        };
        
        patient_appointments
    }

    /// Update appointment status
    public entry fun update_appointment_status(
        provider: &signer,
        appointment_id: String,
        new_status: String,
    ) acquires ProviderRegistry {
        let provider_addr = signer::address_of(provider);
        
        assert!(exists<ProviderRegistry>(provider_addr), error::not_found(ENO_PERMISSIONS));
        
        let registry = borrow_global_mut<ProviderRegistry>(provider_addr);
        let len = vector::length(&registry.appointments);
        let i = 0;
        let found = false;
        
        while (i < len) {
            let appointment = vector::borrow_mut(&mut registry.appointments, i);
            if (&appointment.id == &appointment_id) {
                appointment.status = new_status;
                found = true;
                break
            };
            i = i + 1;
        };
        
        assert!(found, error::not_found(EAPPOINTMENT_NOT_FOUND));
    }

    /// Update patient information
    public entry fun update_patient(
        provider: &signer,
        patient_id: String,
        name: String,
        age: u8,
        contact: String,
        email: String,
        address: String,
        medical_history: String,
    ) acquires ProviderRegistry {
        let provider_addr = signer::address_of(provider);
        
        assert!(exists<ProviderRegistry>(provider_addr), error::not_found(ENO_PERMISSIONS));
        
        let registry = borrow_global_mut<ProviderRegistry>(provider_addr);
        let len = vector::length(&registry.patients);
        let i = 0;
        let found = false;
        
        while (i < len) {
            let patient = vector::borrow_mut(&mut registry.patients, i);
            if (&patient.id == &patient_id) {
                patient.name = name;
                patient.age = age;
                patient.contact = contact;
                patient.email = email;
                patient.address = address;
                patient.medical_history = medical_history;
                found = true;
                break
            };
            i = i + 1;
        };
        
        assert!(found, error::not_found(EPATIENT_NOT_FOUND));
    }
    
    /// Test helper functions
    #[test_only]
    public fun initialize_for_test(provider: &signer) {
        initialize(provider);
    }
    
    #[test_only]
    public fun test_has_provider_registry(provider_addr: address): bool {
        exists<ProviderRegistry>(provider_addr)
    }
    
    #[test_only]
    public fun test_has_event_handles(provider_addr: address): bool {
        exists<EventHandles>(provider_addr)
    }
    
    #[test_only]
    public fun test_patient_count(provider_addr: address): u64 acquires ProviderRegistry {
        let registry = borrow_global<ProviderRegistry>(provider_addr);
        vector::length(&registry.patients)
    }
    
    #[test_only]
    public fun test_record_count(provider_addr: address): u64 acquires ProviderRegistry {
        let registry = borrow_global<ProviderRegistry>(provider_addr);
        vector::length(&registry.medical_records)
    }
    
    #[test_only]
    public fun test_appointment_count(provider_addr: address): u64 acquires ProviderRegistry {
        let registry = borrow_global<ProviderRegistry>(provider_addr);
        vector::length(&registry.appointments)
    }
    
    #[test_only]
    public fun test_patient_matches(
        provider_addr: address, 
        index: u64,
        expected_id: String,
        expected_name: String,
        expected_age: u8,
        expected_gender: String,
        expected_contact: String,
        expected_email: String,
        expected_address: String,
        expected_medical_history: String
    ): bool acquires ProviderRegistry {
        let registry = borrow_global<ProviderRegistry>(provider_addr);
        let patient = vector::borrow(&registry.patients, index);
        
        patient.id == expected_id &&
        patient.name == expected_name &&
        patient.age == expected_age &&
        patient.gender == expected_gender &&
        patient.contact == expected_contact &&
        patient.email == expected_email &&
        patient.address == expected_address &&
        patient.medical_history == expected_medical_history
    }
    
    #[test_only]
    public fun test_record_matches(
        provider_addr: address,
        index: u64,
        expected_id: String,
        expected_patient_id: String,
        expected_record_type: String,
        expected_diagnosis: String,
        expected_treatment: String,
        expected_notes: String
    ): bool acquires ProviderRegistry {
        let registry = borrow_global<ProviderRegistry>(provider_addr);
        let record = vector::borrow(&registry.medical_records, index);
        
        record.id == expected_id &&
        record.patient_id == expected_patient_id &&
        record.record_type == expected_record_type &&
        record.diagnosis == expected_diagnosis &&
        record.treatment == expected_treatment &&
        record.notes == expected_notes
    }
    
    #[test_only]
    public fun test_appointment_matches(
        provider_addr: address,
        index: u64,
        expected_id: String,
        expected_patient_id: String,
        expected_date: String,
        expected_time: String, 
        expected_purpose: String,
        expected_status: String
    ): bool acquires ProviderRegistry {
        let registry = borrow_global<ProviderRegistry>(provider_addr);
        let appointment = vector::borrow(&registry.appointments, index);
        
        appointment.id == expected_id &&
        appointment.patient_id == expected_patient_id &&
        appointment.date == expected_date &&
        appointment.time == expected_time &&
        appointment.purpose == expected_purpose &&
        appointment.status == expected_status
    }
    
    #[test_only]
    public fun test_get_appointment_status(provider_addr: address, index: u64): String acquires ProviderRegistry {
        let registry = borrow_global<ProviderRegistry>(provider_addr);
        let appointment = vector::borrow(&registry.appointments, index);
        appointment.status
    }
    
    #[test_only] 
    public fun test_patient_has_fields(
        provider_addr: address,
        index: u64,
        field_name: String,
        expected_value: String
    ): bool acquires ProviderRegistry {
        let registry = borrow_global<ProviderRegistry>(provider_addr);
        let patient = vector::borrow(&registry.patients, index);
        
        if (field_name == string::utf8(b"name")) {
            return patient.name == expected_value
        } else if (field_name == string::utf8(b"gender")) {
            return patient.gender == expected_value
        } else if (field_name == string::utf8(b"contact")) {
            return patient.contact == expected_value
        } else if (field_name == string::utf8(b"email")) {
            return patient.email == expected_value
        } else if (field_name == string::utf8(b"address")) {
            return patient.address == expected_value
        } else if (field_name == string::utf8(b"medical_history")) {
            return patient.medical_history == expected_value
        } else if (field_name == string::utf8(b"id")) {
            return patient.id == expected_value
        };
        
        false
    }
}