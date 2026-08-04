import { PrismaClient, Role, FuelType, Transmission, VehicleStatus, LeadOrigin, LeadStatus, CompanyStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

/** Fotos de estoque (Unsplash) para demo */
const CAR_PHOTOS = [
  'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1542362567-b07e54358753?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1617531653332-bd46c24f7067?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1553440569-bcc63803a83d?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1617469767053-d3b523a0b982?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1485291571150-772b2092f5c3?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1525609004556-c46c7d6cf392?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1502877338535-766e1452684b?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1544829090-b0d3e5a7f7a3?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?auto=format&fit=crop&w=1200&q=80',
];

const BANNER_PHOTOS = [
  'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1542362567-b07e54358753?auto=format&fit=crop&w=1600&q=80',
];

function photosForVehicle(index: number, count = 3): string[] {
  const urls: string[] = [];
  for (let i = 0; i < count; i++) {
    urls.push(CAR_PHOTOS[(index * count + i) % CAR_PHOTOS.length]);
  }
  return urls;
}

function vehicleImagesCreate(companyId: string, index: number, count = 3) {
  return {
    create: photosForVehicle(index, count).map((url, order) => ({
      companyId,
      url,
      order,
    })),
  };
}

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
          primaryColor: '#e10600',
          secondaryColor: '#b00500',
        },
        about:
          'A AutoPrime Veículos oferece as melhores opções em seminovos selecionados, com garantia e procedência.',
        whatsapp: '5511999998888',
        social: {
          instagram: '@autoprme',
          facebook: 'autoprme',
          youtube: '',
          tiktok: '',
        },
        banners: [
          {
            id: 'banner-autoprme-1',
            imageUrl: BANNER_PHOTOS[0],
            title: 'Seminovos selecionados',
            subtitle: 'Estoque renovado toda semana',
            linkUrl: '',
            order: 0,
          },
          {
            id: 'banner-autoprme-2',
            imageUrl: BANNER_PHOTOS[1],
            title: 'Financiamento facilitado',
            subtitle: 'Aprove as melhores condições na loja',
            linkUrl: '',
            order: 1,
          },
        ],
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
        originalPrice: 142900,
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
        images: vehicleImagesCreate(company.id, 0),
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
        images: vehicleImagesCreate(company.id, 1),
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
        images: vehicleImagesCreate(company.id, 2),
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
        images: vehicleImagesCreate(company.id, 3),
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
        images: vehicleImagesCreate(company.id, 4),
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

  // --- RibeiroCar: loja demo com 20 carros ---
  const ribeiro = await prisma.company.create({
    data: {
      name: 'Ribeiro Car',
      slug: 'ribeirocar',
      document: '98.765.432/0001-10',
      email: 'contato@ribeirocar.com.br',
      phone: '(11) 3333-4455',
      address: 'Av. Brasil, 2500',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01430-000',
      website: 'https://ribeirocar.com.br',
      planId: planPro.id,
      status: CompanyStatus.ACTIVE,
      settings: JSON.stringify({
        theme: {
          primaryColor: '#0b5fff',
          secondaryColor: '#0847c7',
        },
        about:
          'A Ribeiro Car é especializada em seminovos selecionados, com estoque renovado e atendimento direto.',
        whatsapp: '5511999887766',
        social: {
          instagram: '@ribeirocar',
          facebook: 'ribeirocar',
          youtube: '',
          tiktok: '',
        },
        banners: [
          {
            id: 'banner-ribeiro-1',
            imageUrl: BANNER_PHOTOS[0],
            title: 'Ribeiro Car estoque premium',
            subtitle: 'Seminovos com procedência e atendimento direto',
            linkUrl: '',
            order: 0,
          },
          {
            id: 'banner-ribeiro-2',
            imageUrl: BANNER_PHOTOS[1],
            title: 'Troca com avaliação na hora',
            subtitle: 'Traga seu usado e saia de carro novo',
            linkUrl: '',
            order: 1,
          },
          {
            id: 'banner-ribeiro-3',
            imageUrl: BANNER_PHOTOS[2],
            title: 'Financiamento em até 60x',
            subtitle: 'Simule agora pelo WhatsApp',
            linkUrl: '',
            order: 2,
          },
        ],
        businessHours: 'Seg a Sex 8h–18h | Sáb 8h–14h',
      }),
    },
  });

  fs.mkdirSync(path.join(process.cwd(), 'uploads', `empresa-${ribeiro.id}`), {
    recursive: true,
  });

  const ribeiroAdmin = await prisma.user.create({
    data: {
      name: 'Roberto Ribeiro',
      email: 'admin@ribeirocar.com.br',
      password: passwordHash,
      role: Role.STORE_ADMIN,
      companyId: ribeiro.id,
      active: true,
      phone: '(11) 98877-6655',
    },
  });

  const ribeiroCars = [
    { brand: 'Toyota', model: 'Corolla', version: 'XEi 2.0', year: 2022, yearModel: 2023, price: 132900, originalPrice: 149900, mileage: 28000, color: 'Prata', fuel: FuelType.FLEX, transmission: Transmission.AUTOMATIC },
    { brand: 'Honda', model: 'Civic', version: 'EXL 2.0', year: 2021, yearModel: 2021, price: 124900, originalPrice: 139900, mileage: 39000, color: 'Preto', fuel: FuelType.FLEX, transmission: Transmission.CVT },
    { brand: 'Volkswagen', model: 'Polo', version: 'Highline 1.0 TSI', year: 2023, yearModel: 2023, price: 89900, originalPrice: 99900, mileage: 15000, color: 'Branco', fuel: FuelType.FLEX, transmission: Transmission.AUTOMATIC },
    { brand: 'Chevrolet', model: 'Tracker', version: 'Premier 1.2', year: 2022, yearModel: 2022, price: 118900, originalPrice: null, mileage: 31000, color: 'Cinza', fuel: FuelType.FLEX, transmission: Transmission.AUTOMATIC },
    { brand: 'Hyundai', model: 'Creta', version: 'Limited 1.0 TGDI', year: 2023, yearModel: 2024, price: 139900, originalPrice: 154900, mileage: 12000, color: 'Azul', fuel: FuelType.FLEX, transmission: Transmission.CVT },
    { brand: 'Fiat', model: 'Pulse', version: 'Impetus 1.0 Turbo', year: 2023, yearModel: 2023, price: 109900, originalPrice: null, mileage: 18000, color: 'Vermelho', fuel: FuelType.FLEX, transmission: Transmission.CVT },
    { brand: 'Jeep', model: 'Renegade', version: 'Longitude 1.3 T270', year: 2022, yearModel: 2022, price: 114900, originalPrice: 124900, mileage: 35000, color: 'Branco', fuel: FuelType.FLEX, transmission: Transmission.AUTOMATIC },
    { brand: 'Nissan', model: 'Kicks', version: 'Exclusive 1.6', year: 2021, yearModel: 2021, price: 97900, originalPrice: null, mileage: 42000, color: 'Prata', fuel: FuelType.FLEX, transmission: Transmission.CVT },
    { brand: 'Renault', model: 'Duster', version: 'Iconic 1.6', year: 2022, yearModel: 2022, price: 99900, originalPrice: 109900, mileage: 29000, color: 'Cinza', fuel: FuelType.FLEX, transmission: Transmission.CVT },
    { brand: 'Ford', model: 'Territory', version: 'Titanium 1.5', year: 2023, yearModel: 2023, price: 159900, originalPrice: null, mileage: 14000, color: 'Preto', fuel: FuelType.FLEX, transmission: Transmission.AUTOMATIC },
    { brand: 'Toyota', model: 'Yaris', version: 'XLS 1.5', year: 2021, yearModel: 2021, price: 84900, originalPrice: 92900, mileage: 47000, color: 'Branco', fuel: FuelType.FLEX, transmission: Transmission.AUTOMATIC },
    { brand: 'Honda', model: 'HR-V', version: 'EXL 1.5', year: 2022, yearModel: 2022, price: 134900, originalPrice: null, mileage: 26000, color: 'Cinza', fuel: FuelType.FLEX, transmission: Transmission.CVT },
    { brand: 'Volkswagen', model: 'Nivus', version: 'Highline 1.0', year: 2023, yearModel: 2023, price: 119900, originalPrice: 129900, mileage: 16000, color: 'Azul', fuel: FuelType.FLEX, transmission: Transmission.AUTOMATIC },
    { brand: 'Chevrolet', model: 'Onix Plus', version: 'Premier 1.0 Turbo', year: 2022, yearModel: 2022, price: 92900, originalPrice: null, mileage: 33000, color: 'Prata', fuel: FuelType.FLEX, transmission: Transmission.AUTOMATIC },
    { brand: 'Hyundai', model: 'HB20', version: 'Diamond Plus 1.0', year: 2023, yearModel: 2023, price: 86900, originalPrice: 94900, mileage: 11000, color: 'Vermelho', fuel: FuelType.FLEX, transmission: Transmission.AUTOMATIC },
    { brand: 'Fiat', model: 'Fastback', version: 'Limited Edition 1.3', year: 2023, yearModel: 2024, price: 139900, originalPrice: null, mileage: 9000, color: 'Cinza', fuel: FuelType.FLEX, transmission: Transmission.AUTOMATIC },
    { brand: 'Peugeot', model: '208', version: 'GT 1.0 Turbo', year: 2023, yearModel: 2023, price: 98900, originalPrice: 108900, mileage: 17000, color: 'Laranja', fuel: FuelType.FLEX, transmission: Transmission.AUTOMATIC },
    { brand: 'Mitsubishi', model: 'Outlander', version: 'HPE-S 2.0', year: 2020, yearModel: 2020, price: 149900, originalPrice: null, mileage: 55000, color: 'Preto', fuel: FuelType.FLEX, transmission: Transmission.CVT },
    { brand: 'BMW', model: '320i', version: 'GP 2.0 Turbo', year: 2021, yearModel: 2021, price: 219900, originalPrice: 239900, mileage: 38000, color: 'Branco', fuel: FuelType.GASOLINE, transmission: Transmission.AUTOMATIC },
    { brand: 'Mercedes-Benz', model: 'C 180', version: 'Avantgarde 1.6', year: 2020, yearModel: 2020, price: 209900, originalPrice: null, mileage: 41000, color: 'Prata', fuel: FuelType.GASOLINE, transmission: Transmission.AUTOMATIC },
  ];

  await Promise.all(
    ribeiroCars.map((car, index) =>
      prisma.vehicle.create({
        data: {
          companyId: ribeiro.id,
          createdById: ribeiroAdmin.id,
          brand: car.brand,
          model: car.model,
          version: car.version,
          year: car.year,
          yearModel: car.yearModel,
          price: car.price,
          originalPrice: car.originalPrice,
          mileage: car.mileage,
          plate: `RIB${String(index + 1).padStart(1, '0')}${(10 + index).toString(36).toUpperCase()}${String(20 + index).padStart(2, '0')}`.slice(0, 7),
          fuel: car.fuel,
          transmission: car.transmission,
          color: car.color,
          doors: 4,
          description: `${car.brand} ${car.model} ${car.version}. Seminovo selecionado pela Ribeiro Car, pronto para entrega.`,
          optionals: JSON.stringify([
            'Ar condicionado',
            'Direção elétrica',
            'Vidros elétricos',
            'Multimídia',
          ]),
          status: VehicleStatus.AVAILABLE,
          images: vehicleImagesCreate(ribeiro.id, index + 5),
        },
      }),
    ),
  );

  console.log('✅ Seed concluído com sucesso!');
  console.log('');
  console.log('Credenciais:');
  console.log('  Super Admin : admin@sistema.com / 123456');
  console.log('  Admin Loja  : admin@autoprme.com.br / 123456');
  console.log('  Vendedor    : ana@autoprme.com.br / 123456');
  console.log('  Ribeiro Car : admin@ribeirocar.com.br / 123456');
  console.log(`  Empresa     : ${company.name} (${company.slug})`);
  console.log(`  RibeiroCar  : ${ribeiro.name} (${ribeiro.slug}) · 20 veículos com fotos`);
  console.log('  Vitrine     : /loja/ribeirocar');
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
