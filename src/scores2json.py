# -*- coding: utf-8 -*-
"""
Created on Mon Jun 25 22:04:34 2018

@author: Rafael.Ctt
"""

# Import modules
from music21 import *
import json



# Assign global variables
daxpybs = [270, 272, 274, 276, 286, 288, 292, 294, 296, 298, 300, 318, 320,
           326, 328, 330]#, 302, 354, 356]
daxpybx = [271, 273, 275, 277, 287, 293, 295, 297, 299, 301, 303, 319,
           321, 327, 329, 331]# 289
lsxpybs = [660, 684, 686, 688, 690, 692, 694, 700, 768, 770, 774, 800] #696, 796, 802, 804， 806
lsxpybx = [685, 687, 689, 691, 693, 695, 701, 703, 739, 749, 767, 769, 771,
           773]#661, 663, 689, 697, 699, 797, 799, 801, 803, 805, 807

path = '../scores/'
unit = 0.0625
with open(path + 'lines_data.csv', 'r', encoding='utf-8') as f:
    linesData = f.readlines()
with open(path + 'scores_data.csv', 'r', encoding='utf-8') as f:
    scoresData = f.readlines()



# Define functions
def str2info(line):
    '''
    str --> dic
    Takes a line from the lines-data.csv field and returns a dic with each
    annotation
    '''
    post_line = line.rstrip().split(',')
    info = {}
    info['name'] = post_line[0]
    info['hd'] = post_line[1]
    info['sq'] = post_line[2]
    info['bs'] = post_line[3]
    info['ju'] = post_line[4]
    info['line'] = post_line[5]
    info['line_s'] = float(post_line[6])
    info['line_e'] = float(post_line[7])
    info['tones'] = post_line[8]
    info['s1'] = post_line[9]
    info['s1_s'] = float(post_line[10])
    info['s1_e'] = float(post_line[11])
    info['s2'] = post_line[12]
    info['s2_s'] = float(post_line[13])
    info['s2_e'] = float(post_line[14])
    info['s3'] = post_line[15]
    info['s3_s'] = float(post_line[16])
    info['s3_e'] = float(post_line[17])
    return info


    
def findVoiceParts(score):
    '''
    music21.score --> [music21.part]
    Finds the parts of the singing voice
    '''
    voiceParts = []

    for p in score.parts:
        if len(p.flat.notes) == 0: continue
        i = 0
        n = p.flat.notes[i]
        while n.quarterLength == 0:
            i += 1
            n = p.flat.notes.stream()[i]
        if n.hasLyrics():
                if p.hasElementOfClass('Instrument'):
                    p.remove(p.getInstrument())
                voiceParts.append(p)
    return voiceParts



def scoreLines(lines):
    '''
    list --> {str:[[]]}
    Takes the list of lines and returns a dictionary of paths to a score and a
    list of segments to compute
    '''
    arias = {}
    
    for line in lines:
        lineInfo = str2info(linesData[line])
        ariaName = lineInfo['name']
        start = lineInfo['line_s']
        end = lineInfo['line_e']
        if ariaName == '':
            jump = 1
            newLine = linesData[line-jump]
            while ('Part' in newLine) or (str2info(newLine)['name'] == ''):
                jump += 1
                newLine = linesData[line-jump]
            ariaName = str2info(newLine)['name']
        ariaPath = path + ariaName
        if ariaPath not in arias.keys():
            arias[ariaPath] = [[start, end]]
        else:
            arias[ariaPath].append([start,end])

    return arias



jianpu = {'E':'1', 'F#':'2', 'G#':'3', 'A':'4', 'A#':'4#', 'B':'5', 'C#':'6',
          'D#':'7'}

def getNotes(aria, segments):
    '''
    str, [[float, float]] --> [[[float, int]]]
    Given a path to a score and a list of start and end offsets of lines,
    returns a list of melodies, consisting on a list of time and pitch values.
    '''

    melodies = []

    ariaPath = aria.split('/')[-1]
    ariaName = ariaPath[:-4]
    ariaTitle = scoresInfo[ariaName]
    jsonFile['legend']['titles'].append({"id": ariaName, "title":ariaTitle})
    
    s = converter.parse(aria)
    print('Parsing', ariaPath)
    part = findVoiceParts(s)[0]
    notes = part.flat.notesAndRests.stream()
    for i in range(len(segments)):
        melody = {'id':[ariaName, str(i)], 'melody':[], 'lyrics':[]}
        start = segments[i][0]
        end = segments[i][1]
#        print(start, end)
        line = part.getElementsByOffset(start, end, mustBeginInSpan=False,
                                        classList='Measure')
#        line.show()
        lineNotes = notes.getElementsByOffset(start, end)
        # Compute the measures and upbeats ticks
        m0 = line[0].offset
        mCount = 1
        for m in line:
            mo = int(m.offset - m0)
            measure = {'time': mo, 'value': mCount}
            if measure not in jsonFile['legend']['measures']:
                jsonFile['legend']['measures'].append(measure)
            mCount += 1
            md = int(m.duration.quarterLength)
            if md > 1:
                for i in range(1, md):
                    upbeat = mo + i
                    if upbeat not in jsonFile['legend']['upbeats']:
                        jsonFile['legend']['upbeats'].append(upbeat)
                        
        # Compute the melody
        time = lineNotes[0].offset - m0        
        for n in lineNotes:
            dur = n.quarterLength
            if dur > 0:
                if n.isNote:
                    p = n.pitch.midi
                    if p not in legend.keys():
                        pName = n.name
                        if pName not in jianpu.keys():
                            print('WARNING:', pName, 'not in jianpu')
                        else:
                            legend[p] = jianpu[pName]
                    if n.hasLyrics():
                        l = n.lyric
                        melody['lyrics'].append({'time':time, 'lyric':l})
                else:
                    p = 0
                for i in range(int(dur / unit)):
                    nota = {'time':time, 'pitch':p}
                    melody['melody'].append(nota)
                    time += unit
        melodies.append(melody)

    return melodies



# Main code
scoresInfo = {}
for sLine in scoresData:
    sInfo = sLine.rstrip().split(',')
    name = sInfo[0]
    title = sInfo[1]
    scoresInfo[name] = title

arias = scoreLines(daxpybs)

jsonFile = {'title':'', 'melodies':[], 'legend':{'pitches':[], 'measures':[],
            'upbeats':[], 'titles':[]}}

legend = {}

for aria in arias.keys():
    melodies = getNotes(aria, arias[aria])
    jsonFile['melodies'].extend(melodies)
    
for p in sorted(legend.keys()):
    jsonFile['legend']['pitches'].append({'midi':p, 'name':legend[p]})



with open('daxpybs.json', 'w') as f:
    json.dump(jsonFile, f)
            
    