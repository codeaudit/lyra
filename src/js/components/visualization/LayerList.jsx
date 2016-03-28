'use strict';
var React = require('react'),
    connect = require('react-redux').connect,
    ContentEditable = require('../ContentEditable'),
    lookup = require('../../model').lookup,
    hierarchy = require('../../util/hierarchy'),
    getIn = require('../../util/immutable-utils').getIn,
    selectMark = require('../../actions/selectMark'),
    expandLayers = require('../../actions/expandLayers'),
    toggleLayers = require('../../actions/toggleLayers');

var MARGIN_LEFT = 10;

function mapStateToProps(reduxState, ownProps) {
  var selectedMarkId = getIn(reduxState, 'inspector.selected'),
      expandedLayers = getIn(reduxState, 'inspector.expandedLayers').toJS();

  return {
    selected: selectedMarkId,
    expanded: expandedLayers
  };
}

function mapDispatchToProps(dispatch, ownProps) {
  return {
    select: function(id) {
      // Walk up from the selected primitive to create an array of its parent groups' IDs
      var parentGroupIds = hierarchy.getParentGroupIds(lookup(id));

      // Select the mark,
      dispatch(selectMark(id));
      // And expand the hierarchy so that it is visible
      dispatch(expandLayers(parentGroupIds));
    },
    toggle: function(layerId) {
      dispatch(toggleLayers([layerId]));
    }
  };
}

var Group = connect(
  mapStateToProps,
  mapDispatchToProps
)(React.createClass({
  propTypes: {
    expanded: React.PropTypes.object,
    id: React.PropTypes.number,
    level: React.PropTypes.number,
    select: React.PropTypes.func,
    selected: React.PropTypes.number,
    toggle: React.PropTypes.func
  },

  render: function() {
    var props = this.props,
        level = +props.level,
        groupId = props.id,
        group = lookup(groupId),
        selected = props.selected,
        expanded = props.expanded[groupId];

    var style = {
          marginLeft: -(level + 1) * MARGIN_LEFT,
          paddingLeft: (level + 1) * MARGIN_LEFT
        }, childStyle = {
          marginLeft: -(level + 2) * MARGIN_LEFT,
          paddingLeft: (level + 2) * MARGIN_LEFT
        };

    var contents = expanded ? (
        <ul className="group" style={{marginLeft: MARGIN_LEFT}}>
          <li className="header">Guides <i className="fa fa-plus"></i></li>
          <li className="header">Marks <i className="fa fa-plus"></i></li>
          {group.marks.map(function(id) {
            var mark = lookup(id),
                type = mark.type;

            return type === 'group' ? (
              <Group key={id}
                {...props}
                id={id}
                level={level + 1} />
            ) : (
              <li key={id}>
                <div style={childStyle}
                  className={'name' + (selected === id ? ' selected' : '')}
                  onClick={this.props.select.bind(null, id)}>

                  <ContentEditable obj={mark} prop="name"
                    value={mark.name}
                    onClick={props.select.bind(null, id)} />
                </div>
              </li>
            );
          }, this)}
        </ul>
      ) : null;

    var spinner = expanded ?
      (<i className="fa fa-caret-down" onClick={this.props.toggle.bind(null, this.props.id)}></i>) :
      (<i className="fa fa-caret-right" onClick={this.props.toggle.bind(null, this.props.id)}></i>);

    return (
      <li className={expanded ? 'expanded' : 'contracted'}>
        <div style={style}
          className={'name' + (selected === groupId ? ' selected' : '')}
          onClick={this.props.select.bind(null, groupId)}>
            {spinner}

            <ContentEditable obj={group} prop="name"
              value={group.name}
              onClick={props.select.bind(null, groupId)} />
        </div>
        {contents}
      </li>
    );
  }
}));

var LayerList = React.createClass({
  propTypes: {
    layers: React.PropTypes.array
  },

  render: function() {
    var props = this.props;
    return (
      <div id="layer-list">
        <h2>Layers <i className="fa fa-plus"></i> <span className="edit">Edit<br />Scene</span></h2>

        <ul>
        {this.props.layers.map(function(id) {
          return (
            <Group key={id}
              {...props}
              id={id}
              level={0} />
          );
        }, this)}
        </ul>

      </div>
    );
  }
});

module.exports = LayerList;