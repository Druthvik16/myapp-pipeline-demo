import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UploadPortalMappingComponent } from './upload-portal-mapping.component';

describe('UploadPortalMappingComponent', () => {
  let component: UploadPortalMappingComponent;
  let fixture: ComponentFixture<UploadPortalMappingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [UploadPortalMappingComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UploadPortalMappingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
