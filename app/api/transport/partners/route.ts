import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { TransportPartner, type TransportPartnerType } from '@/models/TransportPartner';

const PARTNER_TYPES: TransportPartnerType[] = [
  'Cab Operator',
  'Tempo / Fleet Operator',
  'Self-Drive Rental',
  '4x4 Operator',
  'Bike Rental',
  'Local Transport Provider'
];

function toStringArray(value: unknown, maxItems = 20, maxLength = 100): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim().slice(0, maxLength))
    .filter(Boolean)
    .slice(0, maxItems);
}

// Registers a new Transport Partner application — always created with status:'pending',
// regardless of any client-supplied status, since verification is a manual, internal
// step (see models/TransportPartner.ts). No dashboard/login is created here; this is
// intake only.
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);

    const businessName = typeof body?.businessName === 'string' ? body.businessName.trim() : '';
    const phone = typeof body?.phone === 'string' ? body.phone.trim() : '';
    const whatsapp = typeof body?.whatsapp === 'string' ? body.whatsapp.trim() : undefined;
    const email = typeof body?.email === 'string' ? body.email.trim() : undefined;
    const state = typeof body?.state === 'string' ? body.state.trim() : '';
    const city = typeof body?.city === 'string' ? body.city.trim() : '';
    const partnerTypes = Array.isArray(body?.partnerTypes)
      ? body.partnerTypes.filter((type: unknown): type is TransportPartnerType => PARTNER_TYPES.includes(type as TransportPartnerType))
      : [];
    const serviceAreas = toStringArray(body?.serviceAreas);
    const vehicleTypes = toStringArray(body?.vehicleTypes);
    const operatingRoutes = toStringArray(body?.operatingRoutes);
    const numberOfVehicles =
      typeof body?.numberOfVehicles === 'number' && Number.isFinite(body.numberOfVehicles) ? body.numberOfVehicles : undefined;
    const basicPricingInfo = typeof body?.basicPricingInfo === 'string' ? body.basicPricingInfo.trim() : undefined;
    const documentsNote = typeof body?.documentsNote === 'string' ? body.documentsNote.trim() : undefined;

    if (!businessName || !phone || !state) {
      return NextResponse.json({ error: 'businessName, phone and state are required' }, { status: 400 });
    }
    if (partnerTypes.length === 0) {
      return NextResponse.json({ error: `At least one partnerType is required, from: ${PARTNER_TYPES.join(', ')}` }, { status: 400 });
    }
    if (serviceAreas.length === 0) {
      return NextResponse.json({ error: 'At least one serviceArea is required' }, { status: 400 });
    }

    await connectDB();

    const partner = await TransportPartner.create({
      businessName: businessName.slice(0, 200),
      phone: phone.slice(0, 30),
      whatsapp: whatsapp?.slice(0, 30),
      email: email?.slice(0, 200),
      state: state.slice(0, 100),
      city: city.slice(0, 100),
      serviceAreas,
      partnerTypes,
      vehicleTypes,
      numberOfVehicles,
      operatingRoutes,
      withDriver: Boolean(body?.withDriver),
      selfDrive: Boolean(body?.selfDrive),
      basicPricingInfo: basicPricingInfo?.slice(0, 1000),
      documentsNote: documentsNote?.slice(0, 1000),
      status: 'pending'
    });

    return NextResponse.json({ id: String(partner._id), status: partner.status }, { status: 201 });
  } catch (error) {
    console.error('Failed to save transport partner application', error);
    return NextResponse.json({ error: 'Failed to save transport partner application' }, { status: 500 });
  }
}
