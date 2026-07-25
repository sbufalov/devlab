## Cheet Sheet

### Retrieve root password (24h after first start)
```bash
docker exec -it gitlab cat /etc/gitlab/initial_root_password
```

### Reset password 
```bash
docker exec -it gitlab gitlab-rails runner "user = User.filter(id: 1).first; user.password = 'ВашНовыйПароль123'; user.password_confirmation = 'ВашНовыйПароль123'; user.save!"
```
