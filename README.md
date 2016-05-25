## Login-boilerplate
Boilerplate to build login based applications on, integrated roles system its build on nodejs and mongodb.

It's fits very well with my other project <a href="https://github.com/sp90/prototype-builder">prototype-builder</a> which is just a basic html app


### Feature list

* Token based login via JWT
* Activation email via mailgun (can easily be customized to support your provider)
* Reset password email via mailgun
* Handlebar mail templates
* Admin user support
* Roles
* Picking data that we need from the req.body
* Sample config file to configurate the lot
* Centralised error handling (binding a db would be nice to see when error happens)

### TODO's

* Two factor auth
	- Google authenticator 
	- SMS code
	- CLEF support
* Thirdparty app support
	- Facebook
	- Linkedin
	- Twitter
	- Google
* New relic integration
* Dockerfile
* Frontend lib to easy utilize this user system
* Error logging (Only to write out stats, so that you might Improve UX)
* Add postman collection to the repo
* Write tests
* Add code linting
* Move each user into a module so each module does 1 thing

### Contributions

Start by writing an issue and we can discuss the use case of it maybe im working on it
Otherwise feel free to share