import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { FormattedComponent } from './formatted/formatted.component';
import { UnformattedComponent } from './unformatted/unformatted.component';
import { RejectedComponent } from './rejected/rejected.component';
import { UploadedComponent } from './uploaded/uploaded.component';
import { ApprovedComponent } from './approved/approved.component';
import { DiscountBucketComponent } from './discount-bucket/discount-bucket.component';
import { DeletedComponent } from './deleted/deleted.component';
const routes: Routes = [
  {path: 'formatted', component: FormattedComponent},
  {path: 'unformatted', component: UnformattedComponent},
  {path: 'rejected', component: RejectedComponent},
  {path: 'uploaded', component: UploadedComponent},
   {path: 'approved', component: ApprovedComponent},
   {path: 'discount-bucket', component: DiscountBucketComponent},
   {path: 'deleted', component: DeletedComponent}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class BucketRoutingModule { }
