import { connectDB } from '@/lib/mongodb';
import { TransportPartner, type TransportPartnerDocument } from '@/models/TransportPartner';
import { getCuratedDestinationBySlug } from '@/lib/destinations';
import type { TransportPartner as TransportPartnerType } from '@/types/transportPartner';

export function toTransportPartner(doc: TransportPartnerDocument): TransportPartnerType {
  return {
    id: String(doc._id),
    businessName: doc.businessName,
    phone: doc.phone,
    whatsapp: doc.whatsapp,
    email: doc.email,
    state: doc.state,
    city: doc.city,
    serviceAreas: doc.serviceAreas,
    partnerTypes: doc.partnerTypes,
    vehicleTypes: doc.vehicleTypes,
    numberOfVehicles: doc.numberOfVehicles,
    operatingRoutes: doc.operatingRoutes,
    withDriver: doc.withDriver,
    selfDrive: doc.selfDrive,
    basicPricingInfo: doc.basicPricingInfo,
    documentsNote: doc.documentsNote,
    status: doc.status,
    regionIds: doc.regionIds?.map(String)
  };
}

export interface PartnerFilter {
  serviceArea?: string;
  regionId?: string;
}

/** Verified/active partners only — never a pending/suspended one, regardless of filter. */
export async function getVerifiedPartners(filter?: PartnerFilter): Promise<TransportPartnerType[]> {
  await connectDB();

  const query: Record<string, unknown> = { status: { $in: ['verified', 'active'] } };
  if (filter?.serviceArea) {
    query.serviceAreas = new RegExp(filter.serviceArea.trim(), 'i');
  }
  if (filter?.regionId) {
    query.regionIds = filter.regionId;
  }

  const docs = await TransportPartner.find(query).lean<TransportPartnerDocument[]>();
  return docs.map(toTransportPartner);
}

/** Resolves the destination's region, then finds verified/active partners serving it. */
export async function getPartnersForDestination(destinationSlug: string): Promise<TransportPartnerType[]> {
  const destination = await getCuratedDestinationBySlug(destinationSlug);
  if (!destination?.regionId) return [];
  return getVerifiedPartners({ regionId: destination.regionId });
}
