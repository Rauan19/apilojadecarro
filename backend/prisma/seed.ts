import { PrismaClient, Role, FuelType, Transmission, VehicleStatus, LeadOrigin, LeadStatus, CompanyStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log('🌱 Iniciando seed...');

  await prisma.apiLog.deleteMany();
  await prisma.apiToken.deleteMany();
  await prisma.schedule.deleteMany();
  await prisma.proposal.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.vehicleImage.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.seller.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();
  await prisma.company.deleteMany();
  await prisma.subscriptionPlan.deleteMany();

  const passwordHash = await bcrypt.hash('123456', 10);

  await prisma.subscriptionPlan.create({
    data: {
      name: 'Básico',
      slug: 'basico',
      description: 'Para lojas começando a digitalizar a operação',
      priceMonthly: 97,
      features: JSON.stringify([
        'Até 80 veículos',
        'Até 5 usuários',
        'Leads e propostas',
        'API pública',
      ]),
      maxVehicles: 80,
      maxUsers: 5,
      active: true,
      sortOrder: 1,
    },
  });

  const planPro = await prisma.subscriptionPlan.create({
    data: {
      name: 'Profissional',
      slug: 'profissional',
      description: 'Para revendas com volume médio de vendas',
      priceMonthly: 197,
      features: JSON.stringify([
        'Veículos ilimitados',
        'Até 15 usuários',
        'Relatórios avançados',
        'API pública',
        'Suporte prioritário',
      ]),
      maxVehicles: null,
      maxUsers: 15,
      active: true,
      sortOrder: 2,
    },
  });

  await prisma.subscriptionPlan.create({
    data: {
      name: 'Empresarial',
      slug: 'empresarial',
      description: 'Para redes e operações de alto volume',
      priceMonthly: 497,
      features: JSON.stringify([
        'Tudo do Profissional',
        'Usuários ilimitados',
        'SLA dedicado',
        'Onboarding assistido',
      ]),
      maxVehicles: null,
      maxUsers: null,
      active: true,
      sortOrder: 3,
    },
  });

  const superAdmin = await prisma.user.create({
    data: {
      name: 'Super Admin',
      email: 'admin@sistema.com',
      password: passwordHash,
      role: Role.SUPER_ADMIN,
      active: true,
      phone: '(11) 99999-0000',
    },
  });

  const company = await prisma.company.create({
    data: {
      name: 'AutoPrime Veículos',
      slug: 'autoprme',
      document: '12.345.678/0001-90',
      email: 'contato@autoprme.com.br',
      phone: '(11) 3456-7890',
      address: 'Av. Paulista, 1000',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01310-100',
      website: 'https://autoprme.meusistema.com',
      planId: planPro.id,
      status: CompanyStatus.ACTIVE,
      settings: JSON.stringify({
        theme: {
          primaryColor: '#0f766e',
          secondaryColor: '#134e4a',
        },
        about:
          'A AutoPrime Veículos oferece as melhores opções em seminovos selecionados, com garantia e procedência.',
        whatsapp: '5511999998888',
        social: {
          instagram: '@autoprme',
          facebook: 'autoprme',
        },
        businessHours: 'Seg a Sex 9h–18h | Sáb 9h–13h',
      }),
    },
  });

  const uploadDir = path.join(process.cwd(), 'uploads', `empresa-${company.id}`);
  fs.mkdirSync(uploadDir, { recursive: true });

  const storeAdmin = await prisma.user.create({
    data: {
      name: 'Carlos Administrador',
      email: 'admin@autoprme.com.br',
      password: passwordHash,
      role: Role.STORE_ADMIN,
      companyId: company.id,
      active: true,
      phone: '(11) 98888-1111',
    },
  });

  const sellerUser = await prisma.user.create({
    data: {
      name: 'Ana Vendedora',
      email: 'ana@autoprme.com.br',
      password: passwordHash,
      role: Role.SELLER,
      companyId: company.id,
      active: true,
      phone: '(11) 97777-2222',
    },
  });

  await prisma.seller.create({
    data: {
      companyId: company.id,
      userId: sellerUser.id,
      commission: 1.5,
      notes: 'Especialista em SUVs',
      active: true,
    },
  });

  const vehicles = await Promise.all([
    prisma.vehicle.create({
      data: {
        companyId: company.id,
        createdById: storeAdmin.id,
        brand: 'Toyota',
        model: 'Corolla',
        version: 'XEI 2.0',
        year: 2022,
        yearModel: 2023,
        price: 128900,
        mileage: 32000,
        plate: 'ABC1D23',
        renavam: '12345678901',
        fuel: FuelType.FLEX,
        transmission: Transmission.AUTOMATIC,
        color: 'Prata',
        doors: 4,
        description: 'Único dono, revisões na concessionária, IPVA pago.',
        optionals: JSON.stringify([
          'Ar condicionado',
          'Multimídia',
          'Câmera de ré',
          'Bancos de couro',
        ]),
        status: VehicleStatus.AVAILABLE,
      },
    }),
    prisma.vehicle.create({
      data: {
        companyId: company.id,
        createdById: storeAdmin.id,
        brand: 'Volkswagen',
        model: 'T-Cross',
        version: 'Highline 1.4 TSI',
        year: 2021,
        yearModel: 2021,
        price: 109900,
        mileage: 45000,
        plate: 'EFG4H56',
        fuel: FuelType.FLEX,
        transmission: Transmission.AUTOMATIC,
        color: 'Branco',
        doors: 4,
        description: 'SUV compacto completo, impecável.',
        optionals: JSON.stringify(['Teto solar', 'Sensor de estacionamento']),
        status: VehicleStatus.AVAILABLE,
      },
    }),
    prisma.vehicle.create({
      data: {
        companyId: company.id,
        createdById: sellerUser.id,
        brand: 'Honda',
        model: 'Civic',
        version: 'Touring 1.5 Turbo',
        year: 2020,
        yearModel: 2020,
        price: 119900,
        mileage: 58000,
        plate: 'HIJ7K89',
        fuel: FuelType.FLEX,
        transmission: Transmission.CVT,
        color: 'Preto',
        doors: 4,
        description: 'Top de linha, teto solar, bancos elétricos.',
        optionals: JSON.stringify(['Teto solar', 'Couro', 'Honda Sensing']),
        status: VehicleStatus.SOLD,
      },
    }),
    prisma.vehicle.create({
      data: {
        companyId: company.id,
        createdById: storeAdmin.id,
        brand: 'Jeep',
        model: 'Compass',
        version: 'Longitude 2.0',
        year: 2023,
        yearModel: 2023,
        price: 159900,
        mileage: 18000,
        plate: 'LMN0P12',
        fuel: FuelType.DIESEL,
        transmission: Transmission.AUTOMATIC,
        color: 'Cinza',
        doors: 4,
        description: 'Diesel 4x4, baixa quilometragem.',
        optionals: JSON.stringify(['4x4', 'Multimídia 10"', 'Piloto automático']),
        status: VehicleStatus.AVAILABLE,
      },
    }),
    prisma.vehicle.create({
      data: {
        companyId: company.id,
        createdById: storeAdmin.id,
        brand: 'Chevrolet',
        model: 'Onix',
        version: 'Premier 1.0 Turbo',
        year: 2022,
        yearModel: 2022,
        price: 78900,
        mileage: 41000,
        plate: 'QRS3T45',
        fuel: FuelType.FLEX,
        transmission: Transmission.AUTOMATIC,
        color: 'Vermelho',
        doors: 4,
        description: 'Hatch completo, ideal para cidade.',
        optionals: JSON.stringify(['MyLink', 'Sensor crepuscular']),
        status: VehicleStatus.RESERVED,
      },
    }),
  ]);

  const customers = await Promise.all([
    prisma.customer.create({
      data: {
        companyId: company.id,
        sellerId: sellerUser.id,
        name: 'João Silva',
        phone: '(11) 91234-5678',
        email: 'joao.silva@email.com',
        city: 'São Paulo',
        state: 'SP',
        notes: 'Interessado em SUVs',
      },
    }),
    prisma.customer.create({
      data: {
        companyId: company.id,
        sellerId: sellerUser.id,
        name: 'Maria Oliveira',
        phone: '(11) 99876-5432',
        email: 'maria.oliveira@email.com',
        city: 'Guarulhos',
        state: 'SP',
      },
    }),
    prisma.customer.create({
      data: {
        companyId: company.id,
        sellerId: storeAdmin.id,
        name: 'Pedro Santos',
        phone: '(11) 95555-4444',
        email: 'pedro.santos@email.com',
        city: 'Osasco',
        state: 'SP',
        notes: 'Prefere financiamento',
      },
    }),
  ]);

  await Promise.all([
    prisma.lead.create({
      data: {
        companyId: company.id,
        sellerId: sellerUser.id,
        customerId: customers[0].id,
        vehicleId: vehicles[0].id,
        name: 'João Silva',
        phone: customers[0].phone,
        email: customers[0].email,
        origin: LeadOrigin.WHATSAPP,
        status: LeadStatus.NEGOTIATION,
        notes: 'Quer test-drive no Corolla',
      },
    }),
    prisma.lead.create({
      data: {
        companyId: company.id,
        name: 'Fernanda Costa',
        phone: '(11) 96666-7777',
        email: 'fernanda@email.com',
        origin: LeadOrigin.SITE,
        status: LeadStatus.NEW,
        vehicleId: vehicles[1].id,
        notes: 'Lead do formulário do site',
      },
    }),
    prisma.lead.create({
      data: {
        companyId: company.id,
        sellerId: sellerUser.id,
        name: 'Ricardo Lima',
        phone: '(11) 94444-3333',
        origin: LeadOrigin.MANUAL,
        status: LeadStatus.ATTENDING,
        notes: 'Visitou a loja',
      },
    }),
    prisma.lead.create({
      data: {
        companyId: company.id,
        name: 'Juliana Mendes',
        phone: '(11) 93333-2222',
        email: 'juliana@email.com',
        origin: LeadOrigin.SITE,
        status: LeadStatus.LOST,
        notes: 'Comprou em outra loja',
      },
    }),
  ]);

  await prisma.proposal.create({
    data: {
      companyId: company.id,
      vehicleId: vehicles[0].id,
      customerId: customers[0].id,
      sellerId: sellerUser.id,
      value: 125000,
      notes: 'Proposta com entrada de R$ 40.000',
    },
  });

  await prisma.schedule.create({
    data: {
      companyId: company.id,
      vehicleId: vehicles[1].id,
      name: 'Fernanda Costa',
      phone: '(11) 96666-7777',
      email: 'fernanda@email.com',
      date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      notes: 'Test-drive T-Cross',
    },
  });

  console.log('✅ Seed concluído com sucesso!');
  console.log('');
  console.log('Credenciais:');
  console.log('  Super Admin : admin@sistema.com / 123456');
  console.log('  Admin Loja  : admin@autoprme.com.br / 123456');
  console.log('  Vendedor    : ana@autoprme.com.br / 123456');
  console.log(`  Empresa     : ${company.name} (${company.slug})`);
  console.log(`  Super Admin ID: ${superAdmin.id}`);
}

main()
  .catch((error) => {
    console.error('❌ Erro no seed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
