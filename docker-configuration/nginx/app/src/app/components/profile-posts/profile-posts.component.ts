import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { Post } from 'src/app/interfaces/post';
import { ButtonsService } from 'src/app/services/buttons/buttons.service';
import { FeedsService } from 'src/app/services/feeds/feeds.service';

@Component({
  selector: 'app-profile-posts',
  templateUrl: './profile-posts.component.html',
  styleUrls: ['./profile-posts.component.css']
})
export class ProfilePostsComponent implements OnInit, OnDestroy {
  public posts: Post[];
  private usernameParam: string;

  private getParamsSubscription: Subscription;
  private removePostSubscription: Subscription;

  constructor(
    private postService: FeedsService,
    private route: ActivatedRoute,
    private buttonService: ButtonsService
  ) {
    this.buttonService.activeButton = 'btn1';
  }

  ngOnInit(): void {
    this.getParamsSubscription = this.route.parent.params.subscribe(params => {
      this.usernameParam = params['username'];

      if (
        this.postService.postsData
        &&
        (this.postService.postsData as Post[]).every(post => post.owner.username === this.usernameParam)
      ) {
        this.posts = this.postService.postsData as Post[];
      } else {
        this.showPosts();
      }
    })
  }

  private showPosts() {
    this.postService.getPosts(this.usernameParam).subscribe(posts => {
      this.posts = posts;

      this.posts.sort( (a,b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateB - dateA;
      });

      return this.posts;
    });
  }

  public removePost(post) {
    this.removePostSubscription = this.postService.removePost(post).subscribe(() => {
      this.showPosts()
    })
  }

  ngOnDestroy(): void {
    if (this.getParamsSubscription) {
      this.getParamsSubscription.unsubscribe();
    }

    if (this.removePostSubscription) {
      this.removePostSubscription.unsubscribe();
    }
  }
}
