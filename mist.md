4 dimensional definite item tracker.

Definitions: 
definite items can be anything that has a defined space in time.
Indefinite items are anything that has no physical or boolean interpretation.
Primary line is a vertical line that represents all relative time indexes with earlier times being higher and later times being lower. The time line is the only line that has no parent line.
Line is an axis of movement along which associated parameters are defined, represented, and accessed.

List of line associations:
Primary Line
Category Line
Item Line

Purpose:
To generate a visual representation of all tracked items and display the topology of item relationships. 

Selection:
Selector inverts the color of the representation of the item on the current line relative to the color of the line.

Navigation:
Navigation along any line always uses directions relative to the parent line or plane.

Mode:
Map mode is the internal representation of all data.
Selection mode is the user interface that allows users to visually manipulate the selection and arrangement of selections and parent elements.

Selection mode description:
Selecting a time index opens the category selection entry box. Users may select defined category options. Once the user makes a selection, the box closes, and a new line is drawn perpendicular to the parent line. Center viewport so the time line is ⅙ of the viewport width, away from the left boundary of the viewport and the category line is ⅙ of the viewport height away from the bottom boundary of the viewport. A new box opens to allow user input for the selected category. Based on user submitted value, populate category line with the item and all related items.

All lines subsequent to the category line, based on user selection, are arranged orthogonal to the plane created by new line’s parent line and and the parent line of the current line. 

Items on each line are arranged based on their relative location on the previous line, but are not visible or selectable to the user unless it has been opened previously by the user in the current session.
