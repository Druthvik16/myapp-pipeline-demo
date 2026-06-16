import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UploadedPreviewComponent } from './uploaded-preview.component';

describe('UploadedPreviewComponent', () => {
  let component: UploadedPreviewComponent;
  let fixture: ComponentFixture<UploadedPreviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [UploadedPreviewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UploadedPreviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
