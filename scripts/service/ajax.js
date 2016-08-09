/**
 * Created by ls-pc on 2016/8/2.
 */
'use strict';
angular.module("app")//不能再加中括号，那会多次启动app
    .factory('path',function(){
        return{
            checkStudentList:'ajax/students',//学生列表接口


            addStudent:'ajax/student',//添加学生接口


            checkStudent:function(id){//查询单个学生接口
                if (!id){
                    return 'ajax/student'
                }else {
                    return 'ajax/student/'+id;
                }
            },
            changeStudent:function(id){//修改学生信息
                if(!id){
                    return 'ajax/student'
                }else {
                    return 'ajax/student/'+id;//一定要加/
                }
            },


            delStudent:function(id){//删除信息
                if (!id){
                    return 'ajax/students'
                }else {
                    return 'ajax/students?id='+id;//????????
                }
            }
        }
    });

