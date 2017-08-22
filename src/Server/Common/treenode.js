'use strict';

module.exports = {

    treeNode: function treeNode(nodeContent) {
        this.nodeContent = nodeContent;
        this.childrenNodes = [];

        this.addChild = function addChild(treeNode) {
        	if (treeNode){
	        	for(var i in this.childrenNodes){
	        		if (this.childrenNodes[i].id === treeMode.id){
	        			return false;
	        		}
	        	}
	        	this.childrenNodes.push(treeNode);

	        	return true;
	        }

	        return false;
        }

        this.deleteChild = function deleteChild(id) {
        	var childNodeIndex;

        	if (id){
	        	for(var i in this.childrenNodes){
	        		if (this.childrenNodes[i].id === id){
	        			childNodeIndex = i;
	        			break; 
	        		}
	        	}

	        	if (childNodeIndex){
	        		this.childNodeIndex.splice(childNodeIndex, 1);
	        	}
	        }
        }
    }
}