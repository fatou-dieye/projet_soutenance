import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProtectedComponent } from './protected.component';

describe('ProtectedComponent', () => {
  let component: ProtectedComponent;
  let fixture: ComponentFixture<ProtectedComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProtectedComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProtectedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();<!-- login.component.html -->
    <div class="login-container">
        <div class="login-card">
          <!-- Logo Section -->
          <div class="logo-section">
            <img src="assets/Yakar.png" alt="Yakar Logo" class="logo">
          </div>
          
          <!-- Login Form -->
          <div class="login-form">
            <h1>Connexion</h1>
            <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
              <!-- Email Field -->
              <div class="form-field">
                <label for="email">Email</label>
                <div class="input-group">
                  <!-- <span class="input-group-text">&#64;</span> -->
                  <input
                    type="email"
                    class="form-control"
                    id="email"
                    formControlName="email"
                    placeholder="nom@exemple.com"
                    [class.is-invalid]="isFieldInvalid('email')"
                  >
                  <!-- Email Validation Messages -->
                  <div 
                    class="invalid-feedback"
                    *ngIf="loginForm.get('email')?.invalid && loginForm.get('email')?.touched"
                  >
                  <div *ngIf="loginForm.get('email')?.invalid && loginForm.get('email')?.touched" class="invalid-feedback">
                    <div *ngIf="loginForm.get('email')?.errors?.['required']">L'email est requis</div>
                    <div *ngIf="loginForm.get('email')?.errors?.['noDomainDot']">Le domaine doit contenir un point (exemple: .com, .fr)</div>
                    <div *ngIf="loginForm.get('email')?.errors?.['email']">L'email n'est pas valide</div>
                    <div *ngIf="loginForm.get('email')?.errors?.['containsSpaces']">L'email ne peut pas contenir d'espaces</div>
                    <div *ngIf="loginForm.get('email')?.errors?.['consecutiveDots']">L'email ne peut pas contenir des points consécutifs</div>
                    <div *ngIf="loginForm.get('email')?.errors?.['dotAtBoundary']">L'email ne peut pas commencer ou finir par un point</div>
                </div>
                  </div>
                </div>
              </div>
      
              <!-- Password Field -->
              <div class="form-field">
                <label for="password">Mot de passe</label>
                <div class="password-input">
                  <input
                    [type]="showPassword ? 'text' : 'password'"
                    id="password"
                    formControlName="password"
                    placeholder="Entrer votre mot de passe"
                    [class.is-invalid]="isFieldInvalid('password')"
                    [class.is-valid]="isFieldValid('password')"
                  >
                  <button 
                    name="togglePassword"
                    class="eye-button"
                    type="button"
                    (click)="togglePasswordVisibility()"
                    aria-label="Toggle password visibility"
                    [attr.aria-pressed]="showPassword"
                  >
                    <i class="bi" [ngClass]="showPassword ? 'bi-eye-slash' : 'bi-eye'"></i>
                  </button>
                </div>
                <!-- Password Validation Messages -->
                <div class="validation-feedback" *ngIf="isFieldTouched('password')">
                  <div class="invalid-feedback" *ngIf="getFieldError('password', 'required')">
                    Le mot de passe est requis
                  </div>
                  <div class="invalid-feedback" *ngIf="getFieldError('password', 'minlength')">
                    Le mot de passe doit contenir au moins {{passwordMinLength}} caractères
                  </div>
                  <div class="invalid-feedback" *ngIf="getFieldError('password', 'pattern')">
                    Le mot de passe doit contenir au moins :
                    <ul class="password-requirements">
                      <li [class.satisfied]="passwordMeetsCriteria('uppercase')">Une majuscule</li>
                      <li [class.satisfied]="passwordMeetsCriteria('lowercase')">Une minuscule</li>
                      <li [class.satisfied]="passwordMeetsCriteria('number')">Un chiffre</li>
                      <li [class.satisfied]="passwordMeetsCriteria('special')">Un caractère spécial</li>
                    </ul>
                  </div>
                </div>
              </div>
      
              <!-- Code Secret Link -->
              <div class="code-secret">
                <a href="javascript:void(0)">Code secret</a>
              </div>
      
              <!-- Submit Button -->
              <button 
                type="submit"
                class="submit-btn"
                [disabled]="!canSubmit()"
              >
                <span *ngIf="!isSubmitting">Se connecter</span>
                <div class="spinner" *ngIf="isSubmitting"></div>
              </button>
      
              <!-- Form Status Message -->
              <div class="form-status" *ngIf="formStatusMessage" [class]="formStatusMessage.type">
                {{ formStatusMessage.text }}
              </div>
            </form>
          </div>
        </div>
      </div>
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
