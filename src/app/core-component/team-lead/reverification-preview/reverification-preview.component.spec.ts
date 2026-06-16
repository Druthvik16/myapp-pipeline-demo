import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReverificationPreviewComponent } from './reverification-preview.component';

describe('ReverificationPreviewComponent', () => {
  let component: ReverificationPreviewComponent;
  let fixture: ComponentFixture<ReverificationPreviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ReverificationPreviewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReverificationPreviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
