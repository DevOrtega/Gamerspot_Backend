import { Component, OnInit } from '@angular/core';
import { UsersService } from 'src/app/services/users/users.service';

@Component({
  selector: 'app-profile-ranking',
  templateUrl: './profile-ranking.component.html',
  styleUrls: ['./profile-ranking.component.css']
})
export class ProfileRankingComponent implements OnInit {
  games: { gameName: string, gameUser: string }[];

  constructor(private userService: UsersService) {
    this.userService.profile.subscribe(x => this.games = x.games);
  }

  ngOnInit(): void {

  }

  existGames(): boolean {
    if (this.games && this.games.length > 0) return true;
   
    return false;
  }
}
