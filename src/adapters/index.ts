// Adapter 接口
export type {
  AdapterConfig,
  IChannelAdapter,
  IInteractionReporter,
  IMediaSender,
  IMessageReceiver,
  InteractionReportParams,
  ITemplateSender,
  ITextSender,
  MediaSendParams,
  SendResult,
  TemplateSendParams,
  TextSendParams,
} from '../interfaces/adapter.interface';

// Mapper 接口
export type {
  IMapper,
  MapperError,
  ValidationError,
} from '../interfaces/mapper.interface';
// AdapterError 异常
export {
  AdapterError,
  AdapterErrorCode,
  createAdapterAlreadyRegisteredError,
  createAdapterNotRegisteredError,
  createInvalidAdapterFactoryError,
  createUnsupportedChannelError,
} from './AdapterError';
// AdapterFactory 适配器工厂
export { AdapterFactory } from './AdapterFactory';

// WABA Schemas
export {
  WabaAckSchema,
  WabaInboundSchema,
  WabaMediaUploadResponseSchema,
  WabaOutboundMediaSchema,
  WabaOutboundSchema,
  WabaOutboundTemplateSchema,
  WabaOutboundTextSchema,
} from './waba/schemas';

export type {
  WabaAckDto,
  WabaAckStatus,
  WabaInboundDto,
  WabaMediaUploadResponse,
  WabaMessageType,
  WabaOutboundDto,
  WabaOutboundMediaDto,
  WabaOutboundTemplateDto,
  WabaOutboundTextDto,
} from './waba/types';

// WABA 适配器
export { WabaAdapter } from './waba/WabaAdapter';
export { WabaMapper } from './waba/WabaMapper';
