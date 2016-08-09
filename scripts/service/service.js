/**
 * Created by ls-pc on 2016/8/2.
 */
'use strict';
angular.module("app")
    .factory('serviceStudent',function($http,path){
        return{
            //查询学生列表
            checkStudentList:function(){
                return $http.get(path.checkStudentList);

            },
            //添加学生
            addStudent:function(params){
                return $http({
                    url:path.addStudent,//不加引号
                    method:'post',
                    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                    transformRequest: function (data) {
                        return $.param(data)
                    },
                    data: params
                })

            },

            //删除信息
            delStudent:function(id){
                return $http.post(path.delStudent(id))
            },

            //更改信息
            changeStudent:function(id,params){
                return $http({
                    url:path.changeStudent(id),
                    method:'put',
                    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                    transformRequest: function (data) {
                        return $.param(data)
                    },
                    data: params
                })
            },
            //查询信息
            checkStudent:function(id){
                return $http.get(path.checkStudent(id))
            }

        }
    });
