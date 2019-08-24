import { Component } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthenticationService } from '../service/authentication.service';

@Component({
  selector: 'collegien-main-nav',
  templateUrl: './main-nav.component.html',
  styleUrls: ['./main-nav.component.css']
})
export class MainNavComponent {

  public horaireComponent =   true;
  public listNomPrenomComponent: boolean;
  public presenceComponent: boolean;

  isHandset$: Observable<boolean> = this.breakpointObserver.observe(Breakpoints.Handset)
    .pipe(
      map(result => result.matches),
    );

  constructor(private breakpointObserver: BreakpointObserver, public auth: AuthenticationService) {}

  //  Suppression de tous les composants
  resetAll(){
    this.horaireComponent = false ;
    this.listNomPrenomComponent = false;
    this.presenceComponent = false;
  }

  // Suppression des couleurs
  resetAllColor(){
    document.getElementById('supervisor').classList.remove('btn-color');
    document.getElementById('visuel').classList.remove('btn-color');
    document.getElementById('presence').classList.remove('btn-color');
  }

  // Bouton de l'affichage de la 
  btnVisuelFunction() {
    this.resetAll();
    this.resetAllColor();
    this.horaireComponent = true ;
     document.getElementById('visuel').classList.add('btn-color');
  }

  // Bouton des informatiosn du college
  btnInfoCollegienFunction() {
    this.resetAll();
    this.resetAllColor();
    this.listNomPrenomComponent = true;
    document.getElementById('supervisor').classList.add('btn-color');
  }

  // Bouton de la presence
  btnInfoPresenceFunction() {
    this.resetAll();
    this.resetAllColor();

    this.presenceComponent = true;
    document.getElementById('presence').classList.add('btn-color');
  }

}
