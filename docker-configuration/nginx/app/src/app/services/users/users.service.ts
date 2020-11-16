import { Injectable } from '@angular/core';
import axios from 'axios';
import jwt_decode from 'jwt-decode';

@Injectable({
  providedIn: 'root'
})
export class UsersService {

  private serverUrl:string = 'http://ec2-15-237-13-78.eu-west-3.compute.amazonaws.com:3000/users';
  private token:string = JSON.parse(localStorage.getItem('token'));
  private user:string;

  constructor() { }

  getUsers() {
    return axios.get(this.serverUrl).then(response => response.data);
  }

  getUserByUsername() {
    const tokenData: any = this.getDecodeAccessToken();

    return axios.get(`${this.serverUrl}/${tokenData.user.username}`, {
      headers: {
        Authorization: 'Bearer ' + this.token
      }
    }).then(response => response.data);
  }

  postToken(userData) {
    return axios.post(`${this.serverUrl}/login`, userData, { withCredentials: true }).then(response => {
      return response.data;
    });
  }

  revokeToken() {
    return axios.post(`${this.serverUrl}/revoke-token`, { withCredentials: true }).then(response => response.data);
  }

  setUserProfile(username) {
    this.user = username;
  }

  registerUser(user) {
    return axios.post(`${this.serverUrl}/register`, user).then(response => response.data);
  }

  editUserProfile(user, profile) {
    return axios.patch(`${this.serverUrl}/${user}`, profile, {
      headers: {
        Authorization: 'Bearer ' + this.token
      }
    }).then(response => response.data);
  }

  getDecodeAccessToken() {
    try {
      return jwt_decode(this.token);
    }
    catch(Error) {
      return null;
    }
  }
}
