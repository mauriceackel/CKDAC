import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AccountCardComponent } from './account-card.component';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@NgModule({
  declarations: [AccountCardComponent],
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule
  ], 
  exports: [AccountCardComponent],
  entryComponents: [AccountCardComponent]
})
export class AccountCardModule { }
