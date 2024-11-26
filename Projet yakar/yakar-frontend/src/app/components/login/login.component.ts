import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../auth.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    CommonModule
  ]
})
export class LoginComponent implements OnInit {
  loginMode: 'email' | 'code' = 'email';
  email: string = '';
  mot_passe: string = '';
  code1: string = '';
  code2: string = '';
  code3: string = '';
  code4: string = '';
  inputsDisabled: boolean = false;
  emailError: string = '';
  passwordError: string = '';
  codeError: string = '';
  errorMessage: string = '';
  isLoading: boolean = false;

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit() {
    if (this.authService.isLoggedIn()) {
      this.redirectBasedOnRole();
    }
  }

  toggleLoginMode(mode: 'email' | 'code'): void {
    this.loginMode = mode;
    this.clearInputs();
  }

  clearInputs(): void {
    this.email = '';
    this.mot_passe = '';
    this.code1 = '';
    this.code2 = '';
    this.code3 = '';
    this.code4 = '';
    this.emailError = '';
    this.passwordError = '';
    this.codeError = '';
    this.errorMessage = '';
  }
  

  validateEmail(): boolean {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!this.email) {
      this.emailError = 'L\'email est requis';
      return false;
    }
    if (!emailRegex.test(this.email)) {
      this.emailError = 'Adresse email non valide';
      return false;
    }
    this.emailError = '';
    return true;
  }

  validatePassword(): boolean {
    if (!this.mot_passe) {
      this.passwordError = 'Le mot de passe est requis';
      return false;
    }
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])[A-Za-z\d!@#$%^&*(),.?":{}|<>]{8,}$/;
    if (!passwordRegex.test(this.mot_passe)) {
      this.passwordError = 'Le mot de passe doit comporter au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial';
      return false;
    }
    this.passwordError = '';
    return true;
  }

  // moveToNext(event: any, nextInputName: string): void {
  //   if (event.target.value.length === 1) {
  //     const nextInput = document.getElementsByName(nextInputName)[0] as HTMLInputElement;
  //     if (nextInput) {
  //       nextInput.focus();
  //     }
  //   }
  // }

  async checkCode(): Promise<void> {
    this.isLoading = true;
    this.codeError = '';
    this.errorMessage = '';
  
    // Assembler et nettoyer le code
    const fullCode = `${this.code1}${this.code2}${this.code3}${this.code4}`.trim();
    
    // Validation du format
    if (fullCode.length !== 4 || !/^\d{4}$/.test(fullCode)) {
      this.codeError = 'Le code doit contenir exactement 4 chiffres';
      this.isLoading = false;
      return;
    }
  
    try {
      const response = await this.authService.connexionCode(fullCode).toPromise();
      
      if (response?.token) {
        // Stocker le token
        this.authService.setToken(response.token);
        
        // Stocker les infos utilisateur si présentes
        if (response.utilisateur) {
          this.authService.setUtilisateur(JSON.stringify(response.utilisateur));
        }
        
        // Redirection
        this.redirectBasedOnRole();
      } else {
        this.codeError = 'Code secret incorrect';
        this.resetCodeInputs();
      }
    } catch (error: any) {
      console.error('Erreur de connexion:', error);
      this.codeError = 'Code secret incorrect';
      this.resetCodeInputs();
    } finally {
      this.isLoading = false;
    }
  }
  
  // Ajouter cette nouvelle méthode
  private resetCodeInputs(): void {
    this.code1 = '';
    this.code2 = '';
    this.code3 = '';
    this.code4 = '';
    
    // Remettre le focus sur le premier champ
    setTimeout(() => {
      const firstInput = document.getElementsByName('code1')[0] as HTMLInputElement;
      if (firstInput) {
        firstInput.focus();
      }
    }, 100);
  }
  
  // Modifier la méthode moveToNext
  moveToNext(event: any, nextInputName: string): void {
    const input = event.target;
    const value = input.value;
  
    // Vérifier que c'est un chiffre
    if (!/^\d*$/.test(value)) {
      input.value = '';
      return;
    }
  
    if (value.length === 1) {
      if (nextInputName) {
        const nextInput = document.getElementsByName(nextInputName)[0] as HTMLInputElement;
        if (nextInput) {
          nextInput.focus();
        }
      } else {
        // Si c'est le dernier champ et qu'il est valide, vérifier le code
        if (this.code1 && this.code2 && this.code3 && this.code4) {
          this.checkCode();
        }
      }
    }
  }

  async onLogin(): Promise<void> {
    this.isLoading = true;
    this.errorMessage = '';

    if (!this.validateEmail() || !this.validatePassword()) {
      this.isLoading = false;
      return;
    }

    try {
      const response = await this.authService.connexionEmail(this.email, this.mot_passe).toPromise();
      
      if (response?.token) {
        // Stocker le token et les informations utilisateur
        this.authService.setToken(response.token);
        if (response.utilisateur) {
          this.authService.setUtilisateur(JSON.stringify(response.utilisateur));
        }
        
        // Rediriger l'utilisateur
        this.redirectBasedOnRole();
      } else {
        this.errorMessage = 'Erreur lors de la connexion. Veuillez réessayer.';
      }
    } catch (error: any) {
      console.error('Erreur de connexion:', error);
      this.errorMessage = error?.error?.message || 'Email ou mot de passe incorrect';
    } finally {
      this.isLoading = false;
    }
  }

  private redirectBasedOnRole(): void {
    const user = this.authService.getUserFromToken();
    console.log('Redirecting user:', user);

    if (user?.role === 'administrateur') {
      this.router.navigate(['/dashboard-admin']);
    } else {
      this.router.navigate(['/dashboard']);
    }
  }
}