import { Module } from '@nestjs/common';
import { SuppliersModule } from './suppliers/suppliers.module.js';

@Module({
  imports: [SuppliersModule],
  exports: [SuppliersModule],
})
export class BusinessModule {}
