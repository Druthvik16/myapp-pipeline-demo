import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UnformattedComponent } from './unformatted.component';

describe('UnformattedComponent', () => {
  let component: UnformattedComponent;
  let fixture: ComponentFixture<UnformattedComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [UnformattedComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UnformattedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
