import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UploadHeaderComponent } from './upload-header.component';

describe('UploadHeaderComponent', () => {
  let component: UploadHeaderComponent;
  let fixture: ComponentFixture<UploadHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [UploadHeaderComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UploadHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
