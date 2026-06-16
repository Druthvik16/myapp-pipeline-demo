import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormattedComponent } from './formatted.component';

describe('FormattedComponent', () => {
  let component: FormattedComponent;
  let fixture: ComponentFixture<FormattedComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FormattedComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FormattedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
