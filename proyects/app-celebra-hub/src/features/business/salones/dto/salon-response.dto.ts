import { Salon, SalonI } from "../salon.model";

export type SalonResponseDto = SalonI;

export const toSalonResponse = (
  salon: Salon
): SalonResponseDto => {
  return salon.toJSON() as SalonResponseDto;
};
