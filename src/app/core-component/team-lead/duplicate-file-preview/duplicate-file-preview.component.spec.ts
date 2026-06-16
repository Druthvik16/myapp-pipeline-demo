import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DuplicateFilePreviewComponent } from './duplicate-file-preview.component';

describe('DuplicateFilePreviewComponent', () => {
  let component: DuplicateFilePreviewComponent;
  let fixture: ComponentFixture<DuplicateFilePreviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DuplicateFilePreviewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DuplicateFilePreviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
