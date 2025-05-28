import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModifierPersonnelsComponent } from './modifier-personnels.component';

describe('ModifierPersonnelsComponent', () => {
  let component: ModifierPersonnelsComponent;
  let fixture: ComponentFixture<ModifierPersonnelsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModifierPersonnelsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModifierPersonnelsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
