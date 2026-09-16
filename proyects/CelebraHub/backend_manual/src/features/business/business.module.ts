import { Module } from '@nestjs/common';
import { SuppliersModule } from './suppliers/suppliers.module';

@Module({
  imports: [SuppliersModule],
  exports: [SuppliersModule],
})
export class BusinessModule {}
