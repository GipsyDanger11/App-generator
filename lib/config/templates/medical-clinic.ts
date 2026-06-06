// Medical Clinic Management
// Entities: Patient, Appointment, Prescription
// Unique layout: timeline for appointments, patient records, prescription log

import type { AppConfig } from '../types';

export const medicalClinicConfig: AppConfig = {
  name: 'Medical Clinic',
  description: 'Patient records, appointment scheduling, and prescription management.',
  theme: { primary: '#0891b2', accent: '#22d3ee', logoText: '🏥 ClinicOS' },
  entities: [
    {
      name: 'Patient',
      label: 'Patient',
      labelPlural: 'Patients',
      fields: [
        { name: 'fullName',   type: 'string', label: 'Full Name',       required: true, showInList: true, searchable: true },
        { name: 'dob',        type: 'date',   label: 'Date of Birth',   showInList: true },
        { name: 'gender',     type: 'select', label: 'Gender',          showInList: true, options: [
          { value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }, { value: 'other', label: 'Other' },
        ]},
        { name: 'phone',      type: 'string', label: 'Phone',           showInList: true },
        { name: 'email',      type: 'email',  label: 'Email' },
        { name: 'address',    type: 'string', label: 'Address' },
        { name: 'bloodGroup', type: 'select', label: 'Blood Group',     showInList: true, options: [
          { value: 'A+', label: 'A+' }, { value: 'A-', label: 'A-' }, { value: 'B+', label: 'B+' },
          { value: 'B-', label: 'B-' }, { value: 'AB+', label: 'AB+' }, { value: 'O+', label: 'O+' }, { value: 'O-', label: 'O-' },
        ]},
        { name: 'allergies',  type: 'text',   label: 'Known Allergies' },
        { name: 'medHistory', type: 'text',   label: 'Medical History' },
      ],
    },
    {
      name: 'Appointment',
      label: 'Appointment',
      labelPlural: 'Appointments',
      fields: [
        { name: 'patient',    type: 'relation', label: 'Patient',    entity: 'Patient', showInList: true },
        { name: 'dateTime',   type: 'datetime', label: 'Date & Time', required: true, showInList: true },
        { name: 'doctor',     type: 'string',   label: 'Doctor',      showInList: true },
        { name: 'type',       type: 'select',   label: 'Visit Type',  showInList: true, options: [
          { value: 'checkup',     label: '🩺 Regular Check-up' },
          { value: 'followup',    label: '🔄 Follow-up' },
          { value: 'emergency',   label: '🚨 Emergency' },
          { value: 'specialist',  label: '👨‍⚕️ Specialist' },
          { value: 'vaccination', label: '💉 Vaccination' },
        ]},
        { name: 'status',     type: 'select',   label: 'Status',      showInList: true, options: [
          { value: 'scheduled',  label: '📅 Scheduled' },
          { value: 'checked_in', label: '✅ Checked In' },
          { value: 'completed',  label: '✓ Completed' },
          { value: 'cancelled',  label: '✗ Cancelled' },
          { value: 'no_show',    label: '⚠️ No Show' },
        ]},
        { name: 'duration',   type: 'number',   label: 'Duration (mins)', default: 30 },
        { name: 'notes',      type: 'text',     label: 'Clinical Notes' },
        { name: 'diagnosis',  type: 'text',     label: 'Diagnosis' },
      ],
    },
    {
      name: 'Prescription',
      label: 'Prescription',
      labelPlural: 'Prescriptions',
      fields: [
        { name: 'patient',    type: 'relation', label: 'Patient',      entity: 'Patient', showInList: true },
        { name: 'doctor',     type: 'string',   label: 'Prescribed By', showInList: true },
        { name: 'date',       type: 'date',     label: 'Date',          required: true, showInList: true },
        { name: 'medication', type: 'string',   label: 'Medication',    required: true, showInList: true },
        { name: 'dosage',     type: 'string',   label: 'Dosage',        showInList: true },
        { name: 'frequency',  type: 'select',   label: 'Frequency', options: [
          { value: 'once', label: 'Once daily' }, { value: 'twice', label: 'Twice daily' },
          { value: 'thrice', label: 'Three times daily' }, { value: 'as_needed', label: 'As needed' },
        ], showInList: true },
        { name: 'duration',   type: 'string',   label: 'Duration',      showInList: true },
        { name: 'refillable', type: 'boolean',  label: 'Refillable?',   default: false },
        { name: 'notes',      type: 'text',     label: 'Instructions' },
      ],
    },
  ],
  pages: [
    // HOME — clinic reception dashboard
    { id: 'home',       route: '/', title: 'Reception', root: { kind: 'hero', props: {
      title: '🏥 Medical Clinic', subtitle: "Today's appointments, patient records, and prescriptions at a glance.",
      cta: 'Book Appointment', ctaRoute: '/appointments/new',
    }}},
    { id: 'home-stats', route: '/', title: 'Reception', root: { kind: 'stats', props: { items: [
      { label: 'Total Patients',      source: { entity: 'Patient',      op: 'count' } },
      { label: "Today's Appointments",source: { entity: 'Appointment',  op: 'count' } },
      { label: 'Prescriptions Issued',source: { entity: 'Prescription', op: 'count' } },
    ]}}},
    // Appointments shown as a TIMELINE (clinic-style schedule)
    { id: 'home-sched-h', route: '/', title: 'Schedule', root: { kind: 'heading', props: { text: "📅 Today's Schedule", level: 2 }}},
    { id: 'home-sched',   route: '/', title: 'Schedule', entity: 'Appointment', root: { kind: 'timeline', props: {
      entity: 'Appointment', dateField: 'dateTime', titleField: 'doctor', descriptionField: 'type',
    }}},

    // PATIENTS directory
    { id: 'patients-h',   route: '/patients',     title: 'Patients', root: { kind: 'heading', props: { text: 'Patient Directory', level: 1 }}},
    { id: 'patients-stats', route: '/patients',   title: 'Patients', root: { kind: 'stats', props: { items: [
      { label: 'Total Patients', source: { entity: 'Patient', op: 'count' } },
    ]}}},
    { id: 'patients',     route: '/patients',     title: 'Patients', entity: 'Patient', root: { kind: 'table', props: { entity: 'Patient', pageSize: 25 }}},
    { id: 'patients-new', route: '/patients/new', title: 'Register Patient', entity: 'Patient', root: { kind: 'form', props: { entity: 'Patient', mode: 'create', successRoute: '/patients' }}},

    // APPOINTMENTS — timeline + table toggle
    { id: 'appts-h',     route: '/appointments',     title: 'Appointments', root: { kind: 'heading', props: { text: 'All Appointments', level: 1 }}},
    { id: 'appts-stats', route: '/appointments',     title: 'Appointments', root: { kind: 'stats', props: { items: [
      { label: 'Scheduled',  source: { entity: 'Appointment', op: 'count' } },
      { label: 'Completed',  source: { entity: 'Appointment', op: 'count' } },
      { label: 'Cancelled',  source: { entity: 'Appointment', op: 'count' } },
    ]}}},
    { id: 'appts-type-chart', route: '/appointments', title: 'By Type', root: { kind: 'chart', props: {
      entity: 'Appointment', groupBy: 'type', title: 'Appointments by Visit Type', type: 'pie',
    }}},
    { id: 'appts',     route: '/appointments',     title: 'Appointments', entity: 'Appointment', root: { kind: 'table', props: { entity: 'Appointment', pageSize: 20 }}},
    { id: 'appts-new', route: '/appointments/new', title: 'Book Appointment', entity: 'Appointment', root: { kind: 'form', props: { entity: 'Appointment', mode: 'create', successRoute: '/appointments' }}},

    // PRESCRIPTIONS
    { id: 'rx-h',    route: '/prescriptions',     title: 'Prescriptions', root: { kind: 'heading', props: { text: 'Prescriptions', level: 1 }}},
    { id: 'rx',      route: '/prescriptions',     title: 'Prescriptions', entity: 'Prescription', root: { kind: 'table', props: { entity: 'Prescription', pageSize: 25 }}},
    { id: 'rx-new',  route: '/prescriptions/new', title: 'New Prescription', entity: 'Prescription', root: { kind: 'form', props: { entity: 'Prescription', mode: 'create', successRoute: '/prescriptions' }}},
  ],
};
