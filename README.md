# data_vis
INF552 course @ Ecole polytechnique about Data Visualisation

# Use the code
_Remark: all the following command should be run at the root of the project_
## Ready to use
### With Docker
* Run my image using `docker run -p 8080:80 romainfd/inf552`
* Then go to your localhost at http://localhost:8080 and choose the exercise you want to see

### With a python server
* Run `python3 -m http.server 8080`
* Then go to your localhost at http://localhost:8080 and choose the exercise you want to see

## Modify the code
### With Docker
* Clone the git repo on your computer
* Modify the code as desired
* Build the new Docker image: `docker build -f Dockerfile -t $USERNAME/inf552 .`
* Run your image: `docker run -p 8080:80 $USERNAME/inf552`
* Go to http://localhost:8080

### With Python
Modify the code and then follow the 'Ready To Use > With a python server' part
