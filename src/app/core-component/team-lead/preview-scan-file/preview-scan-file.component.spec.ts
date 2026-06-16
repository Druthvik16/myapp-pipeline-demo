import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PreviewScanFileComponent } from './preview-scan-file.component';

describe('PreviewScanFileComponent', () => {
  let component: PreviewScanFileComponent;
  let fixture: ComponentFixture<PreviewScanFileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PreviewScanFileComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PreviewScanFileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
