import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UploadStoreComponent } from './upload-store.component';

describe('UploadStoreComponent', () => {
  let component: UploadStoreComponent;
  let fixture: ComponentFixture<UploadStoreComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [UploadStoreComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UploadStoreComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
