import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChangementMotsPassComponent } from './changement-mots-pass.component';

describe('ChangementMotsPassComponent', () => {
  let component: ChangementMotsPassComponent;
  let fixture: ComponentFixture<ChangementMotsPassComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChangementMotsPassComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChangementMotsPassComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
