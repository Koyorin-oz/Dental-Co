import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Admin user
  const admin = await prisma.user.upsert({
    where: { email: 'admin@clinic.ae' },
    update: {},
    create: {
      clerkId: 'seed_admin_clerk_id',
      email: 'admin@clinic.ae',
      firstName: 'Admin',
      lastName: 'User',
      role: Role.ADMIN,
    },
  });
  console.log('Created admin:', admin.email);

  // Doctor 1
  const doctor1User = await prisma.user.upsert({
    where: { email: 'dr.ali@clinic.ae' },
    update: {},
    create: {
      clerkId: 'seed_doctor1_clerk_id',
      email: 'dr.ali@clinic.ae',
      firstName: 'Ali',
      lastName: 'Hassan',
      phone: '+971501234567',
      role: Role.DOCTOR,
      doctorProfile: {
        create: {
          specialty: 'General Dentistry',
          licenseNumber: 'UAE-DEN-001',
          color: '#3B82F6',
          workingHours: {
            monday: { start: '09:00', end: '17:00' },
            tuesday: { start: '09:00', end: '17:00' },
            wednesday: { start: '09:00', end: '17:00' },
            thursday: { start: '09:00', end: '17:00' },
            friday: { start: '09:00', end: '13:00' },
          },
        },
      },
    },
  });
  console.log('Created doctor:', doctor1User.email);

  // Doctor 2
  const doctor2User = await prisma.user.upsert({
    where: { email: 'dr.sara@clinic.ae' },
    update: {},
    create: {
      clerkId: 'seed_doctor2_clerk_id',
      email: 'dr.sara@clinic.ae',
      firstName: 'Sara',
      lastName: 'Ahmed',
      phone: '+971507654321',
      role: Role.DOCTOR,
      doctorProfile: {
        create: {
          specialty: 'Orthodontics',
          licenseNumber: 'UAE-DEN-002',
          color: '#10B981',
          workingHours: {
            sunday: { start: '10:00', end: '18:00' },
            monday: { start: '10:00', end: '18:00' },
            tuesday: { start: '10:00', end: '18:00' },
            wednesday: { start: '10:00', end: '18:00' },
            thursday: { start: '10:00', end: '18:00' },
          },
        },
      },
    },
  });
  console.log('Created doctor:', doctor2User.email);

  // Receptionist
  const receptionistUser = await prisma.user.upsert({
    where: { email: 'reception@clinic.ae' },
    update: {},
    create: {
      clerkId: 'seed_receptionist_clerk_id',
      email: 'reception@clinic.ae',
      firstName: 'Fatima',
      lastName: 'Al Mansoori',
      role: Role.RECEPTIONIST,
      receptionistProfile: {
        create: {},
      },
    },
  });
  console.log('Created receptionist:', receptionistUser.email);

  // Sample patient
  const patientUser = await prisma.user.upsert({
    where: { email: 'patient.test@example.com' },
    update: {},
    create: {
      clerkId: 'seed_patient_clerk_id',
      email: 'patient.test@example.com',
      firstName: 'Ahmed',
      lastName: 'Al Rashid',
      phone: '+971509876543',
      role: Role.PATIENT,
      patientProfile: {
        create: {
          dateOfBirth: new Date('1985-06-15'),
          gender: 'MALE',
          allergies: ['Penicillin', 'Latex'],
          medicalNotes: 'Hypertensive. Takes Amlodipine 5mg daily.',
          emergencyContactName: 'Mariam Al Rashid',
          emergencyContactPhone: '+971501112233',
        },
      },
    },
  });
  console.log('Created patient:', patientUser.email);

  console.log('Seeding complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
