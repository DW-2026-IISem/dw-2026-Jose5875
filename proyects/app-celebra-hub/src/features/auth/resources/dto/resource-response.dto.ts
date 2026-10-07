import { Resource, ResourceI } from "../resource.model";

/** Respuesta HTTP de un recurso. Sin campos internos: el DTO coincide con el modelo. */
export type ResourceResponseDto = ResourceI;

/** Mapper modelo -> DTO de respuesta (objeto plano). */
export function toResourceResponse(resource: Resource): ResourceResponseDto {
  return resource.toJSON() as ResourceI;
}
