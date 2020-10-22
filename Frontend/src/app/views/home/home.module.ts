import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { HomeComponent } from './home.component';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { OverlayModule } from '@angular/cdk/overlay';
import { AccountCardModule } from '~/app/components/account-card/account-card.module';

@NgModule({
  declarations: [
    HomeComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatInputModule,
    MatCardModule,
    MatSelectModule,
    MatButtonModule,
    AccountCardModule,
    OverlayModule,
    MatListModule,
    RouterModule,
    MatIconModule,
    MatToolbarModule
  ],
  exports: [
    HomeComponent
  ]
})
export class HomeModule { }
