import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BulkBrandImportComponent } from './bulk-brand-import.component';

describe('BulkBrandImportComponent', () => {
  let component: BulkBrandImportComponent;
  let fixture: ComponentFixture<BulkBrandImportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [BulkBrandImportComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BulkBrandImportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
