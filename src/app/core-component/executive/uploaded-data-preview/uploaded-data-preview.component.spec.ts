import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UploadedDataPreviewComponent } from './uploaded-data-preview.component';

describe('UploadedDataPreviewComponent', () => {
  let component: UploadedDataPreviewComponent;
  let fixture: ComponentFixture<UploadedDataPreviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [UploadedDataPreviewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UploadedDataPreviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
