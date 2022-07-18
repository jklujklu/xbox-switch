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

