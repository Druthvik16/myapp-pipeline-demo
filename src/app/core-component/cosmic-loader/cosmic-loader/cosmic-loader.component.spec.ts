import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CosmicLoaderComponent } from './cosmic-loader.component';

describe('CosmicLoaderComponent', () => {
  let component: CosmicLoaderComponent;
  let fixture: ComponentFixture<CosmicLoaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CosmicLoaderComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CosmicLoaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
