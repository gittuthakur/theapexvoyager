export type TransportPartnerType =
  | 'Cab Operator'
  | 'Tempo / Fleet Operator'
  | 'Self-Drive Rental'
  | '4x4 Operator'
  | 'Bike Rental'
  | 'Local Transport Provider';

export type TransportPartnerStatus = 'pending' | 'verified' | 'active' | 'suspended';

export interface TransportPartner {
  id: string;
  businessName: string;
  phone: string;
  whatsapp?: string;
  email?: string;
  state: string;
  city: string;
  serviceAreas: string[];
  partnerTypes: TransportPartnerType[];
  vehicleTypes: string[];
  numberOfVehicles?: number;
  operatingRoutes?: string[];
  withDriver: boolean;
  selfDrive: boolean;
  basicPricingInfo?: string;
  documentsNote?: string;
  status: TransportPartnerStatus;
  regionIds?: string[];
}
