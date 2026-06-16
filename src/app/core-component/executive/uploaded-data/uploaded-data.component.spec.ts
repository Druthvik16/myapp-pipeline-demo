import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UploadedDataComponent } from './uploaded-data.component';

describe('UploadedDataComponent', () => {
  let component: UploadedDataComponent;
  let fixture: ComponentFixture<UploadedDataComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [UploadedDataComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UploadedDataComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
