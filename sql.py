# -*- coding: utf-8 -*-
# @Time : 7/9/2022 3:41 PM
# @Author : jklujklu
# @Email : jklujklu@126.com
# @File : sql.py
# @Software: PyCharm
import sqlite3


class SQL:
    def __init__(self, database='./config.db'):
        self.conn = sqlite3.connect(database)
        self.check_database()

    def check_database(self):
        cursor = self.conn.cursor()
        try:
            cursor.execute("SELECT * FROM Amiibo")
        except sqlite3.OperationalError:
            print('Not detect the database, start init config database, please wait.')
            self._sql(
                'CREATE TABLE Amiibo (ID INTEGER Primary KEY AUTOINCREMENT, Description TEXT, Image TEXT, Bin BLOB)')

    def _sql(self, sql, *args, close=True):
        cursor = self.conn.cursor()
        rs = cursor.execute(sql, args)
        if close:
            cursor.close()
        self.conn.commit()
        return rs

    def insert_amiibo(self, image, value, description):
        sql = '''INSERT INTO Amiibo(id, Description, Image, Bin) VALUES (NULL, ?, ?, ?)'''
        rs = self._sql(sql, description, image, value)
        if rs.rowcount == 1:
            print('insert success')
            return True
        else:
            print('insert failed!')
            return False

    def delete_amiibo(self, _id):
        sql = f'DELETE FROM Amiibo WHERE ID = {_id}'
        rs = self._sql(sql)
        if rs.rowcount == 1:
            print('delete success')
            return True
        else:
            print('delete failed!')
            return False

    def select_amiibo(self, _id):
        sql = f'SELECT * FROM Amiibo WHERE ID = {_id}'
        rs = self._sql(sql, close=False)
        rows = rs.fetchall()
        return rows

    def list_amiibo(self):
        sql = 'select * from Amiibo'
        rs = self._sql(sql, close=False)
        rows = rs.fetchall()
        return rows


if __name__ == '__main__':
    bin_23 = b'\x04\xfeF4\x92\xaaR\x80\xeaH\x0f\xe0\xf1\x10\xff\xee\xa5\x00\x01\x00\xa1\xec+6\xfb#\xa6\x84S\x1e\xf1WUR:\xcd\xdf\xe6\xf7I\x7f2,\xa8\xdd\x8f\xda\xc7>\xc3i\x0cY\xa7\xcfysI\xa4\xaf}\x88\x19l-\x05\xd2\xa0\xaa8\xfd\x89\x10N\xf8>\xbc\xb7\xff\xd3\xcd\xee;\xbc\x01\x00\x00\x00\x03N\t\x02\r\x12\xa6\x0f\x1dQ\xf0Q\x01\xeb#\xaey\x18\xedp\xd6\x7f@\x15@\xb2#\xdd\xf0\xdb\xc7>\xe9\x86\xfbp<m\xf3\xaf` \xce\xe3\xe0\xe6\x12\xab6]~\xebt\xb6V\xde\x96\x96\xf8g\xe9\xdd\x9c\xef\xb9~\x168\xc8\xc3\xc3\x00\x18\x05\x99\x8e\x96WU\x8fAk\xe4\xa4`y\xb3\xcc\x89\xd3e\x94\x944\xe5~\xfd\x0b\x99x\x1d\xfd\x07\xe2\x11U\xf0\\\x8b\xd9\xcba\x1d\xd4q\xcc\x82Q!e\x18\x1e06\x8a/\x05\xa5\xe3\x81]Q\x8a\x14\x87t\x81l\x84\xbc\xa0\xb2|\x1cZkxY\xab\x8c\x94\x1a\x8d>\x0cHE|\xe5\x9d|\x91\x97\x8e\x04\xa2\x12\x9et\xb2\xcd\x15w\x93eUJ\xeb\xbf|P\x15\xd9"\xbc\x07F\x92\x1d\xdf\xd2b}luV\xa7\xd8\xb5\xa0\xbf\xb2\xc5~m\xea\x91\xccFC\xb7U\x8c\x1b\xbb\x8d:\xf8m\xd7\x19\x9c:\xfa\xb5[<\xa0\x16e\xf3\x93f\x06\xf9\x8f#\x8d/<@\xfc~\xa8\x06\xc5\xff\xeb\x91\x7f\x90pf\x17\x8f\x7f\xbc/\xa2\x9c\x1f\xd2\x89@\xa6>\x90\x05\x16!\x08\xf9\xff%m\x04\x98\xa3\xd8\xce\x8e\xcc i\x8e0\xccH\xcen\x80P\x96N&3\xf7h\x9f\xabb7\xde\xce\x00g\xb4\x80\xe91\xd4\xcbA\x82a>)\x92\x07^\x00r\xd7\xf2r\xe0\x88\xcf\xcf\xee\xfa\xe5cI\x9a{m"\x1c\x1c\xaf3\xb6>\x82\xf4\xe51\x87@\x92\xd6/1\xce\xeb\x88D\xe3\xc7\xeb\xaf"\x823\x0ez-\xcb-\x06\x88\xd2\x05\x12\x7f\xe1\xae\xb9\xe8\x8c\xda\x1bAn|\xf8\x8b\xe7\xcf\x97\xb1Y\x12\xb4\x90\xbd"\xf3\x13\x1d\xf0\x11\xae\x1f\x83~\x822q3\x87{\xa6Gp\xd7\xdb\x1ct\xd4m"N\xcf\x84\xe8\xe2\xea\x8d\xa5\xea\x01\x00\x0f\xbd\x00\x00\x00\x04_\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00'
    image = r'C:\Users\lhy\Pictures\47f4c019880711ebb6edd017c2d2eca2.jpg'
    des = 'test'
    # SQL().insert_amiibo(image, bin_23, des)
    # SQL().delete_amiibo(1)
    # SQL().list_amiibo()
    print(SQL().select_amiibo(1))

