import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PreScanApprovalComponent } from './pre-scan-approval.component';

describe('PreScanApprovalComponent', () => {
  let component: PreScanApprovalComponent;
  let fixture: ComponentFixture<PreScanApprovalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PreScanApprovalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PreScanApprovalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
